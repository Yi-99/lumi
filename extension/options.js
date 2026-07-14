// options.js — settings page logic. Secrets go through vault.js (AES-GCM at
// rest); the non-secret flags, theme, and proxy URL use chrome.storage.sync.
// Saved keys are never echoed back into the DOM — the field shows a masked
// placeholder and an "Encrypted ✓" status instead.
//
// Everything except keys saves instantly (toggles, theme chips, proxy URL);
// the Save button seals typed keys into the vault.

// Firefox: promise-style chrome.* lives on browser.*; alias it over.
if (typeof browser !== "undefined") globalThis.chrome = browser;

const PROVIDERS = [
  { field: "anthropicKey", flag: "claudeEnabled", test: testAnthropic },
  { field: "openaiKey", flag: "gptEnabled", test: testOpenAI },
  { field: "geminiKey", flag: "geminiEnabled", test: testGemini },
];

// ---------- Sidebar tabs ----------

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((b) => b.classList.toggle("active", b === btn));
    document
      .querySelectorAll(".panel")
      .forEach((p) =>
        p.classList.toggle("active", p.id === `panel-${btn.dataset.panel}`)
      );
  });
});

async function refresh() {
  await migrateLegacyKeys(); // no-op unless upgrading from plaintext version
  const stored = await vaultStatus();
  const flags = await chrome.storage.sync.get([
    ...PROVIDERS.map((p) => p.flag),
    "proxyUrl",
    "theme",
  ]);
  for (const p of PROVIDERS) {
    setSwitch(document.getElementById(p.flag), flags[p.flag] !== false);
    setKeyStatus(p.field, stored.includes(p.field));
  }
  document.getElementById("proxyUrl").value = flags.proxyUrl || "";
  setThemeChips(flags.theme || "system");
  applyPageTheme(flags.theme || "system");
  await renderUsage();
}

// ---------- Enable/disable switches (instant save) ----------

function setSwitch(el, on) {
  el.classList.toggle("on", on);
  el.setAttribute("aria-checked", String(on));
}

document.querySelectorAll(".switch").forEach((el) => {
  const flip = async () => {
    const on = !el.classList.contains("on");
    setSwitch(el, on);
    await chrome.storage.sync.set({ [el.id]: on });
  };
  el.addEventListener("click", flip);
  el.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flip();
    }
  });
});

// ---------- Token usage (accumulated by background.js per lookup) ----------

const USAGE_LABELS = { claude: "Claude", gpt: "GPT-4o", gemini: "Gemini" };

function fmtTokens(v) {
  const n = Number(v) || 0; // storage is extension-written; coerce anyway
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

async function renderUsage() {
  const { usage = {} } = await chrome.storage.local.get("usage");
  const list = document.getElementById("usageList");
  const rows = Object.keys(USAGE_LABELS)
    .filter((id) => usage[id])
    .map((id) => {
      const u = usage[id];
      const lookups = Number(u.lookups) || 0;
      return `<div class="urow">
        <span class="uname">${USAGE_LABELS[id]}</span>
        <span class="unums">${fmtTokens(u.input)} in · ${fmtTokens(u.output)} out</span>
        <span class="ulook">${lookups} lookup${lookups === 1 ? "" : "s"}</span>
      </div>`;
    });
  list.innerHTML = rows.length
    ? rows.join("")
    : `<div class="uempty">No lookups yet — counts appear after your first query.</div>`;
}

// Live-refresh while the page is open (lookups can finish in the background)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.usage) renderUsage();
});

document.getElementById("resetUsage").addEventListener("click", async () => {
  await chrome.storage.local.set({ usage: {} });
  await renderUsage();
});

// ---------- Theme (shared with the lookup card via chrome.storage.sync) ----------

const systemDark = matchMedia("(prefers-color-scheme: dark)");
systemDark.addEventListener("change", () => {
  const active = document.querySelector("#themeChips .chip-btn.active");
  applyPageTheme(active ? active.dataset.theme : "system");
});

function applyPageTheme(theme) {
  const dark = theme === "dark" || (theme !== "light" && systemDark.matches);
  document.documentElement.classList.toggle("dark", dark);
}

function setThemeChips(theme) {
  document
    .querySelectorAll("#themeChips .chip-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.theme === theme));
}

// Instant apply + persist; the content script live-updates any open card
document.querySelectorAll("#themeChips .chip-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    setThemeChips(btn.dataset.theme);
    applyPageTheme(btn.dataset.theme);
    await chrome.storage.sync.set({ theme: btn.dataset.theme });
  });
});

// ---------- Proxy URL (instant save on change) ----------

document.getElementById("proxyUrl").addEventListener("change", async (e) => {
  await chrome.storage.sync.set({ proxyUrl: e.target.value.trim() });
});

// ---------- Key cards ----------

function setKeyStatus(field, saved) {
  const input = document.getElementById(field);
  const card = document.querySelector(`.pcard[data-field="${field}"]`);
  const status = card.querySelector(".pstatus");
  status.classList.toggle("ok", saved);
  status.querySelector(".ptext").textContent = saved ? "Encrypted ✓" : "Not set";
  card.querySelector(".field").classList.toggle("ok", saved);
  input.placeholder = saved
    ? "••••••••  saved — paste to replace"
    : input.dataset.ph;
  card.querySelector(".remove").style.display = saved ? "" : "none";
}

const saveBtn = document.getElementById("save");
saveBtn.addEventListener("click", async () => {
  for (const p of PROVIDERS) {
    const input = document.getElementById(p.field);
    const v = input.value.trim();
    if (v) {
      await vaultSet(p.field, v); // sealed before it touches disk
      input.value = ""; // don't keep the plaintext in the DOM
    }
  }
  // URL, not a secret — sync storage, not the vault
  await chrome.storage.sync.set({
    proxyUrl: document.getElementById("proxyUrl").value.trim(),
  });
  await refresh();
  const note = document.getElementById("savedNote");
  saveBtn.textContent = "Saved ✓";
  note.textContent = "Your keys are encrypted and saved on this device.";
  clearTimeout(saveBtn._t);
  saveBtn._t = setTimeout(() => {
    saveBtn.textContent = "Save changes";
    note.textContent = "Keys are encrypted before they touch disk.";
  }, 2200);
});

document.body.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-for]");
  if (!btn) return;
  const field = btn.dataset.for;

  if (btn.classList.contains("eye")) {
    const input = document.getElementById(field);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.classList.toggle("shown", show);
  }

  if (btn.classList.contains("remove")) {
    await vaultSet(field, ""); // delete sealed entry
    await refresh();
  }

  if (btn.classList.contains("test")) {
    const typed = document.getElementById(field).value.trim();
    const key = typed || (await vaultGetAll())[field];
    const p = PROVIDERS.find((x) => x.field === field);
    setTestResult(btn, null, "…");
    if (!key) return setTestResult(btn, false, "no key");
    try {
      const status = await p.test(key);
      if (status === 200) setTestResult(btn, true, "✓ valid");
      else
        setTestResult(
          btn,
          false,
          status === 401 || status === 403 ? "✗ bad key" : `✗ ${status}`
        );
    } catch (_) {
      setTestResult(btn, false, "✗ network");
    }
  }
});

function setTestResult(btn, ok, label) {
  btn.textContent = label;
  btn.classList.toggle("ok", ok === true);
  btn.classList.toggle("bad", ok === false);
  if (ok !== null)
    setTimeout(() => {
      btn.textContent = "Test";
      btn.classList.remove("ok", "bad");
    }, 2500);
}

// ---------- Clear history (proxy-side prompt store) ----------

document.getElementById("clearHistory").addEventListener("click", async () => {
  const btn = document.getElementById("clearHistory");
  const { proxyUrl } = await chrome.storage.sync.get("proxyUrl");
  if (!proxyUrl) return flashBtn(btn, "Set a proxy first");
  try {
    const res = await fetch(`${proxyUrl.replace(/\/+$/, "")}/v1/prompts`, {
      method: "DELETE",
    });
    flashBtn(btn, res.ok ? "Cleared ✓" : `✗ ${res.status}`);
  } catch (_) {
    flashBtn(btn, "✗ offline");
  }
});

function flashBtn(btn, label) {
  btn.textContent = label;
  clearTimeout(btn._t);
  btn._t = setTimeout(() => (btn.textContent = "Clear"), 2200);
}

// ---------- Cheap key-validation pings (list-models endpoints) ----------

async function testAnthropic(key) {
  const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
  });
  return res.status;
}

async function testOpenAI(key) {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { authorization: `Bearer ${key}` },
  });
  return res.status;
}

async function testGemini(key) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(key)}`
  );
  return res.status;
}

refresh();
