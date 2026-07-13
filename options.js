// options.js — key setup workflow. Secrets go through vault.js (AES-GCM at
// rest); only the non-secret enable/disable flags use chrome.storage.sync.
// Saved keys are never echoed back into the DOM — the field shows a masked
// placeholder and an "encrypted ✓" chip instead.

const PROVIDERS = [
  { field: "anthropicKey", flag: "claudeEnabled", test: testAnthropic },
  { field: "openaiKey", flag: "gptEnabled", test: testOpenAI },
  { field: "geminiKey", flag: "geminiEnabled", test: testGemini },
];

async function refresh() {
  await migrateLegacyKeys(); // no-op unless upgrading from plaintext version
  const stored = await vaultStatus();
  const flags = await chrome.storage.sync.get(PROVIDERS.map((p) => p.flag));
  for (const p of PROVIDERS) {
    document.getElementById(p.flag).checked = flags[p.flag] !== false;
    setChip(p.field, stored.includes(p.field));
  }
}

function setChip(field, saved) {
  const input = document.getElementById(field);
  const chip = document.querySelector(`.chip[data-for="${field}"]`);
  chip.textContent = saved ? "encrypted ✓" : "not set";
  chip.classList.toggle("ok", saved);
  input.placeholder = saved
    ? "••••••••  saved — paste to replace"
    : input.dataset.ph;
  document.querySelector(`.remove[data-for="${field}"]`).style.display = saved
    ? ""
    : "none";
}

document.getElementById("save").addEventListener("click", async () => {
  const flagsOut = {};
  for (const p of PROVIDERS) {
    flagsOut[p.flag] = document.getElementById(p.flag).checked;
    const input = document.getElementById(p.field);
    const v = input.value.trim();
    if (v) {
      await vaultSet(p.field, v); // sealed before it touches disk
      input.value = ""; // don't keep the plaintext in the DOM
    }
  }
  await chrome.storage.sync.set(flagsOut);
  await refresh();
  const s = document.getElementById("saved");
  s.classList.add("show");
  setTimeout(() => s.classList.remove("show"), 1800);
});

document.body.addEventListener("click", async (e) => {
  const field = e.target.dataset?.for;
  if (!field) return;

  if (e.target.classList.contains("remove")) {
    await vaultSet(field, ""); // delete sealed entry
    await refresh();
  }

  if (e.target.classList.contains("test")) {
    const btn = e.target;
    const typed = document.getElementById(field).value.trim();
    const key = typed || (await vaultGetAll())[field];
    const p = PROVIDERS.find((x) => x.field === field);
    setTestResult(btn, null, "…");
    if (!key) return setTestResult(btn, false, "no key");
    try {
      const status = await p.test(key);
      if (status === 200) setTestResult(btn, true, "✓ valid");
      else setTestResult(btn, false, status === 401 || status === 403 ? "✗ bad key" : `✗ ${status}`);
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
