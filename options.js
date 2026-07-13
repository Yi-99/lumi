const FIELDS = [
  "anthropicKey",
  "openaiKey",
  "geminiKey",
  "claudeEnabled",
  "gptEnabled",
  "geminiEnabled",
];

chrome.storage.sync.get(FIELDS).then((v) => {
  for (const f of FIELDS) {
    const el = document.getElementById(f);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = v[f] !== false;
    else el.value = v[f] || "";
  }
});

document.getElementById("save").addEventListener("click", async () => {
  const out = {};
  for (const f of FIELDS) {
    const el = document.getElementById(f);
    out[f] = el.type === "checkbox" ? el.checked : el.value.trim();
  }
  await chrome.storage.sync.set(out);
  const s = document.getElementById("saved");
  s.classList.add("show");
  setTimeout(() => s.classList.remove("show"), 1500);
});
