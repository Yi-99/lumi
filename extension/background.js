// background.js — MV3 service worker
// Receives {selection, context} from content script over a Port,
// fans out to all enabled providers in parallel, streams tokens back as
// {type:"chunk", provider, text} and {type:"done"|"error", provider, ...}.
// API keys live encrypted-at-rest in the vault (see vault.js).

// Firefox: promise-style chrome.* lives on browser.*; alias it over.
if (typeof browser !== "undefined") globalThis.chrome = browser;

// Chrome MV3 service worker only; Firefox loads vault.js via manifest
// background.scripts instead.
if (typeof importScripts === "function") importScripts("vault.js");

const PROVIDERS = {
  claude: {
    label: "Claude",
    stream: streamAnthropic,
    keyName: "anthropicKey",
    model: "claude-sonnet-4-6",
  },
  gpt: {
    label: "GPT-4o",
    stream: streamOpenAI,
    keyName: "openaiKey",
    model: "gpt-4o-mini",
  },
  gemini: {
    label: "Gemini",
    stream: streamGemini,
    keyName: "geminiKey",
    model: "gemini-2.0-flash",
  },
};

function buildPrompt(selection, context) {
  return [
    `Define or explain the following selected text in 2-3 sentences, plainly and precisely.`,
    `Use the surrounding passage to disambiguate meaning; explain it *in this context*, not generically.`,
    ``,
    `Selected text: "${selection}"`,
    ``,
    `Surrounding passage:`,
    `"""${context}"""`,
  ].join("\n");
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "lookup") return;

  port.onMessage.addListener(async (msg) => {
    if (msg.type !== "lookup") return;
    const { selection, context, promptOverride, question } = msg;
    const flags = await chrome.storage.sync.get(null); // non-secret toggles
    const secrets = await vaultGetAll(); // decrypted only in worker memory
    const prompt = promptOverride || buildPrompt(selection, context);

    const enabled = Object.entries(PROVIDERS).filter(
      ([id, p]) => secrets[p.keyName] && flags[`${id}Enabled`] !== false
    );

    if (enabled.length === 0) {
      safePost(port, { type: "no-keys" });
      return;
    }

    // Optional local proxy (FastAPI server, see server/). Pre-stream failure
    // (server down, non-2xx) falls back silently to direct provider calls.
    const proxyUrl = (flags.proxyUrl || "").trim();
    if (proxyUrl) savePrompt(proxyUrl, selection, question); // fire-and-forget history
    if (proxyUrl) {
      try {
        await runProxy(proxyUrl, prompt, enabled, secrets, port);
        return;
      } catch (_) {
        /* fall through to direct mode */
      }
    }

    safePost(port, {
      type: "providers",
      providers: enabled.map(([id, p]) => ({ id, label: p.label })),
    });
    runDirect(enabled, prompt, secrets, port);
  });
});

function runDirect(enabled, prompt, secrets, port) {
  enabled.forEach(([id, p]) => {
    const t0 = performance.now();
    p.stream(prompt, secrets[p.keyName], p.model, (text) =>
      safePost(port, { type: "chunk", provider: id, text })
    )
      .then((usage) => {
        if (usage) recordUsage(id, usage);
        safePost(port, {
          type: "done",
          provider: id,
          ms: Math.round(performance.now() - t0),
        });
      })
      .catch((err) =>
        safePost(port, { type: "error", provider: id, message: String(err) })
      );
  });
}

// ---------- Token-usage accounting (shown on the settings page) ----------
// Accumulated per provider in chrome.storage.local. Writes are serialized
// through a promise chain — three providers finishing at once would
// otherwise race the read-modify-write.
let usageWrites = Promise.resolve();
function recordUsage(provider, { input = 0, output = 0 }) {
  usageWrites = usageWrites
    .then(async () => {
      const { usage = {} } = await chrome.storage.local.get("usage");
      const u = usage[provider] || { input: 0, output: 0, lookups: 0 };
      usage[provider] = {
        input: u.input + input,
        output: u.output + output,
        lookups: u.lookups + 1,
      };
      await chrome.storage.local.set({ usage });
    })
    .catch(() => {});
  return usageWrites;
}

// Route the whole lookup through the proxy: one POST, one SSE stream whose
// data payloads ARE the Port message shapes — forward them verbatim.
const KEY_HEADERS = {
  claude: "x-anthropic-key",
  gpt: "x-openai-key",
  gemini: "x-gemini-key",
};

async function runProxy(proxyUrl, prompt, enabled, secrets, port) {
  const headers = { "content-type": "application/json" };
  for (const [id, p] of enabled) headers[KEY_HEADERS[id]] = secrets[p.keyName];
  const res = await fetch(proxyUrl.replace(/\/+$/, "") + "/v1/lookup", {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt,
      max_tokens: 300,
      providers: enabled.map(([id, p]) => ({ id, label: p.label, model: p.model })),
    }),
  });
  if (!res.ok) throw new Error(`proxy ${res.status}`);

  // Post synthetic errors for providers left hanging if the stream drops
  // before their done/error arrives, so pills don't spin forever.
  const settled = new Set();
  await readSSE(res, (data) => {
    if (data.type === "usage") {
      // Server-side usage accounting event — record, don't forward to the UI.
      recordUsage(data.provider, data);
      return;
    }
    if (data.type === "done" || data.type === "error") settled.add(data.provider);
    safePost(port, data);
  });
  for (const [id] of enabled)
    if (!settled.has(id))
      safePost(port, { type: "error", provider: id, message: "proxy stream interrupted" });
}

function safePost(port, msg) {
  try {
    port.postMessage(msg);
  } catch (_) {
    /* port closed (card dismissed) — drop silently */
  }
}

// ---------- Provider adapters (all SSE streaming) ----------

async function streamAnthropic(prompt, key, model, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  // Usage: input arrives on message_start, output (cumulative) on message_delta.
  const usage = { input: 0, output: 0 };
  await readSSE(res, (data) => {
    if (data.type === "content_block_delta" && data.delta?.text)
      onChunk(data.delta.text);
    if (data.type === "message_start")
      usage.input = data.message?.usage?.input_tokens || 0;
    if (data.type === "message_delta" && data.usage?.output_tokens)
      usage.output = data.usage.output_tokens;
  });
  return usage;
}

async function streamOpenAI(prompt, key, model, onChunk) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 300,
      stream_options: { include_usage: true }, // final chunk carries usage
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const usage = { input: 0, output: 0 };
  await readSSE(res, (data) => {
    const t = data.choices?.[0]?.delta?.content;
    if (t) onChunk(t);
    if (data.usage) {
      usage.input = data.usage.prompt_tokens || 0;
      usage.output = data.usage.completion_tokens || 0;
    }
  });
  return usage;
}

async function streamGemini(prompt, key, model, onChunk) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 300 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  // Usage: every chunk carries usageMetadata; the last one has final counts.
  const usage = { input: 0, output: 0 };
  await readSSE(res, (data) => {
    const t = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (t) onChunk(t);
    if (data.usageMetadata) {
      usage.input = data.usageMetadata.promptTokenCount || 0;
      usage.output = data.usageMetadata.candidatesTokenCount || 0;
    }
  });
  return usage;
}

// Shared SSE reader: parses "data: {...}" lines from a streaming fetch body.
async function readSSE(res, onData) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith("data:")) continue;
      const payload = s.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        onData(JSON.parse(payload));
      } catch (_) {
        /* partial/keepalive line */
      }
    }
  }
}

// ---------- Onboarding ----------

// First install (or update from the plaintext-storage version): migrate any
// legacy plaintext keys into the encrypted vault, then open settings if the
// user has no keys yet so the setup flow prompts for them.
chrome.runtime.onInstalled.addListener(async () => {
  await migrateLegacyKeys();
  const stored = await vaultStatus();
  if (stored.length === 0) chrome.runtime.openOptionsPage();
});

// Content script's "no keys" card asks us to open the settings page.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Always a fresh tab (openOptionsPage would reuse/focus an existing one)
  if (msg?.type === "open-options")
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });

  // Card's History panel: fetch past prompts from the local proxy server.
  // (Fetched here, not in the content script, so the request isn't subject
  // to the page's CSP/CORS.)
  if (msg?.type === "get-history") {
    (async () => {
      const { proxyUrl = "" } = await chrome.storage.sync.get("proxyUrl");
      const url = proxyUrl.trim();
      if (!url) return sendResponse({ ok: false, reason: "no-proxy" });
      try {
        const res = await fetch(url.replace(/\/+$/, "") + "/v1/prompts?limit=50");
        if (!res.ok) throw new Error(String(res.status));
        sendResponse({ ok: true, prompts: await res.json() });
      } catch (_) {
        sendResponse({ ok: false, reason: "unreachable" });
      }
    })();
    return true; // keep the message channel open for the async response
  }
});

// ---------- Prompt history (saved server-side when a proxy is configured) ----------

function savePrompt(proxyUrl, selection, question) {
  fetch(proxyUrl.replace(/\/+$/, "") + "/v1/prompts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: question ? "followup" : "lookup",
      selection: selection.slice(0, 400),
      question: question ? question.slice(0, 500) : null,
    }),
  }).catch(() => {
    /* history is best-effort — never block or fail a lookup over it */
  });
}

// Keyboard shortcut — tell the active tab to trigger lookup on selection
chrome.commands?.onCommand.addListener(async (command) => {
  if (command !== "trigger-lookup") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "trigger-lookup" });
});
