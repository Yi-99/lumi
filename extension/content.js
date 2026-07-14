// content.js — selection → Lookup-style card (shadow DOM, page-CSS-proof)
(() => {
  let host = null; // <div> host element carrying the shadow root
  let port = null; // chrome.runtime Port for the in-flight lookup
  let state = null; // { providers, answers, doneCount, firstDone, activeTab }

  const CARD_W = 380;
  const COMPARE_W = 640;
  // Breathing room kept between the card's bottom edge and the page's
  // maximum scroll extent when the card reaches past the page bottom.
  const BOTTOM_GAP = 24;

  // Typewriter pacing: API chunks land in a buffer and are revealed at this
  // steady rate (~83 chars/s) instead of dumping as fast as providers stream.
  const TYPE_TICK_MS = 16;
  const TYPE_CHARS_PER_TICK = 1;
  let drainTimer = null;

  const CLIP_SVG =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const CHECK_SVG =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const GEAR_SVG =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';

  // ---------- Theme (system | light | dark), set from the options page ----------
  let theme = "system";
  chrome.storage?.sync?.get("theme")?.then((v) => {
    theme = v?.theme || "system";
    applyTheme();
  });
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area === "sync" && changes.theme) {
      theme = changes.theme.newValue || "system";
      applyTheme(); // live-update an open card
    }
  });

  function applyTheme() {
    if (!host) return;
    if (theme === "system") delete host.dataset.theme;
    else host.dataset.theme = theme;
  }

  // Dark palette, applied two ways: via prefers-color-scheme unless the user
  // forced light, and unconditionally when the user forced dark.
  const DARK_RULES = `
    .card { background: #262624; color: #ececea;
      border-color: rgba(255,255,255,0.14);
      box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .hdr, .ftr { border-color: rgba(255,255,255,0.10); }
    .ftr { background: #1f1f1d; }
    .pill { border-color: rgba(255,255,255,0.25); color: #b8b8b4; }
    .pill.on { background: #ececea; color: #1a1a1a; border-color: #ececea; }
    .btn { border-color: rgba(255,255,255,0.25); color: #ececea; }
    .btn:hover { background: rgba(255,255,255,0.06); }
    .meta, .col .lbl { color: #8a8a86; }
    .copy { color: #8a8a86; }
    .copy:hover { background: rgba(255,255,255,0.08); color: #ececea; }
    .caret { background: rgba(255,255,255,0.4); }
    .ans.skeleton::after { background: rgba(255,255,255,0.08); }
    .fu input { background: #1f1f1d; border-color: rgba(255,255,255,0.25); }
    .col { border-color: rgba(255,255,255,0.08); }
    .err { color: #f09595; }
  `;

  // ---------- Trigger: mouseup on a selection (word/phrase) ----------
  document.addEventListener("mouseup", (e) => {
    if (host && host.contains(e.target)) return; // clicks inside the card
    setTimeout(maybeOpen, 0); // let selection settle
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dismiss();
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "trigger-lookup") maybeOpen(true);
  });

  document.addEventListener("mousedown", (e) => {
    if (host && !host.contains(e.target)) dismiss();
  });

  function maybeOpen(forced = false) {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 2 || text.length > 400) return;
    if (!forced && text.length > 120) return; // long drags: only via shortcut
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    const context = grabContext(sel);
    openCard(text, rect);
    startLookup(text, context);
  }

  function grabContext(sel) {
    // Surrounding paragraph text — the quality lever.
    let node = sel.anchorNode;
    while (node && node.nodeType !== 1) node = node.parentNode;
    const block = node?.closest("p, li, td, blockquote, article, div") || node;
    return (block?.innerText || "").slice(0, 1500);
  }

  // ---------- Card UI (exact mockup styling) ----------
  function openCard(selectionText, rect) {
    dismiss();
    state = {
      providers: [],
      answers: {},
      status: {},
      doneCount: 0,
      firstDone: null,
      activeTab: null,
      t0: performance.now(),
      compare: false,
      buf: {},
      finished: {},
    };

    host = document.createElement("div");
    host.style.cssText =
      "all:initial; position:absolute; z-index:2147483647; width:0; height:0;";
    const top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;
    left = Math.min(left, window.scrollX + document.documentElement.clientWidth - CARD_W - 16);
    host.style.top = `${top}px`;
    state.baseLeft = Math.max(8, left);
    host.style.left = `${state.baseLeft}px`;
    document.documentElement.appendChild(host);
    applyTheme();

    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; margin: 0; }
        .card {
          width: ${CARD_W}px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #ffffff;
          color: #1a1a1a;
          border: 0.5px solid rgba(0,0,0,0.14);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08);
          overflow: hidden;
          animation: pop 140ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
          transition: width 160ms ease;
        }
        .card.wide { width: ${COMPARE_W}px; }
        @keyframes pop { from { opacity: 0; transform: translateY(4px) scale(0.98); } }
        @media (prefers-reduced-motion: reduce) { .card { animation: none; } }
        .hdr {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 14px;
          border-bottom: 0.5px solid rgba(0,0,0,0.10);
        }
        .term {
          font-size: 13px; font-weight: 500; margin-right: auto;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 45%;
        }
        .pills { display: flex; gap: 6px; }
        .pill {
          font-size: 12px; padding: 3px 10px; border-radius: 999px;
          border: 0.5px solid rgba(0,0,0,0.22);
          background: transparent; color: #666;
          cursor: pointer; font-family: inherit; line-height: 1.4;
        }
        .pill.on { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
        .pill.pending { opacity: 0.45; }
        .body { padding: 14px 16px; }
        .ans { font-size: 14px; line-height: 1.65; min-height: 46px; white-space: pre-wrap; }
        .ans.skeleton::after {
          content: ""; display: block; height: 12px; margin-top: 6px;
          border-radius: 4px; background: rgba(0,0,0,0.06); width: 70%;
        }
        .caret { display: inline-block; width: 7px; height: 14px; vertical-align: -2px;
          background: rgba(0,0,0,0.35); animation: blink 1s steps(1) infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .meta { font-size: 12px; color: #999; margin-top: 10px; }
        .cols { display: flex; gap: 0; }
        .col { flex: 1; padding: 12px 14px; border-left: 0.5px solid rgba(0,0,0,0.08); }
        .col:first-child { border-left: none; }
        .col .lbl { font-size: 11px; font-weight: 500; color: #999; margin-bottom: 6px;
          text-transform: none; letter-spacing: 0.02em; }
        .col .ans { font-size: 13px; min-height: 0; }
        .ftr {
          display: flex; gap: 8px; padding: 8px 12px;
          border-top: 0.5px solid rgba(0,0,0,0.10);
          background: #fafaf8;
        }
        .btn {
          font-size: 12px; padding: 4px 10px; border-radius: 8px;
          border: 0.5px solid rgba(0,0,0,0.22);
          background: transparent; color: #1a1a1a;
          cursor: pointer; font-family: inherit;
        }
        .btn:hover { background: rgba(0,0,0,0.04); }
        .btn:active { transform: scale(0.98); }
        .copy {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; padding: 0; flex: none;
          border: none; border-radius: 6px;
          background: transparent; color: #999; cursor: pointer;
        }
        .copy:hover { background: rgba(0,0,0,0.06); color: #1a1a1a; }
        .copy:active { transform: scale(0.94); }
        .gear { margin-left: auto; }
        .gear svg { display: block; }
        @keyframes gearspin { to { transform: rotate(180deg); } }
        .gear.spin svg { animation: gearspin 0.45s ease; }
        @media (prefers-reduced-motion: reduce) { .gear.spin svg { animation: none; } }
        .lblrow {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 6px;
        }
        .lblrow .lbl { margin-bottom: 0; }
        .metarow {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin-top: 10px;
        }
        .metarow .meta { margin-top: 0; }
        .fu { display: none; padding: 8px 12px 12px; }
        .fu input {
          width: 100%; font: inherit; font-size: 13px;
          padding: 7px 10px; border-radius: 8px;
          border: 0.5px solid rgba(0,0,0,0.22);
          background: #fff; color: inherit; outline: none;
        }
        .fu input:focus { border-color: rgba(0,0,0,0.45); }
        .err { color: #a32d2d; }
        @media (prefers-color-scheme: dark) {
          :host(:not([data-theme="light"])) { ${DARK_RULES} }
        }
        :host([data-theme="dark"]) { ${DARK_RULES} }
      </style>
      <div class="card" role="dialog" aria-label="LLM lookup">
        <div class="hdr">
          <span class="term"></span>
          <span class="pills"></span>
        </div>
        <div class="body">
          <div class="ans skeleton"><span class="caret"></span></div>
          <p class="meta">Asking models…</p>
        </div>
        <div class="ftr">
          <button class="btn" data-act="compare">Compare all</button>
          <button class="btn" data-act="followup">Follow up</button>
          <button class="copy gear" data-act="settings" title="Settings" aria-label="Open settings">${GEAR_SVG}</button>
        </div>
        <div class="fu"><input type="text" placeholder="Ask a follow-up about this…" /></div>
      </div>
      <!-- In-flow spacer: stretches the page's scroll area past the card so
           there's always a gap below it (margins don't extend scroll area). -->
      <div style="height:${BOTTOM_GAP}px"></div>`;

    root.querySelector(".term").textContent = selectionText;
    root.querySelector(".ftr").addEventListener("click", onFooter);
    // Delegated: .copy buttons are re-created on every render
    root.querySelector(".body").addEventListener("click", onCopyClick);
    root.querySelector(".fu input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim())
        runFollowUp(selectionText, e.target.value.trim());
      e.stopPropagation();
    });
    state.selectionText = selectionText;
  }

  // ---------- Streaming wiring ----------
  function startLookup(selection, context, promptOverride) {
    port = chrome.runtime.connect({ name: "lookup" });
    port.onMessage.addListener(onPortMessage);
    port.postMessage({ type: "lookup", selection, context, promptOverride });
  }

  function onPortMessage(msg) {
    if (!host || !state) return;
    const root = host.shadowRoot;

    if (msg.type === "no-keys") {
      const ans = root.querySelector(".ans");
      ans.classList.remove("skeleton");
      ans.innerHTML =
        `<span class="err">No API keys set.</span> Add a key for Claude, GPT, or Gemini once — it's encrypted and stored on this device.`;
      const meta = root.querySelector(".meta");
      meta.textContent = "";
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Open settings";
      btn.addEventListener("click", () =>
        chrome.runtime.sendMessage({ type: "open-options" })
      );
      meta.replaceWith(btn);
      return;
    }

    if (msg.type === "providers") {
      state.providers = msg.providers;
      const pills = root.querySelector(".pills");
      pills.innerHTML = "";
      for (const p of msg.providers) {
        state.answers[p.id] = "";
        state.buf[p.id] = "";
        state.status[p.id] = "pending";
        const b = document.createElement("button");
        b.className = "pill pending";
        b.dataset.id = p.id;
        b.textContent = p.label;
        b.addEventListener("click", () => setTab(p.id));
        pills.appendChild(b);
      }
      return;
    }

    if (msg.type === "chunk") {
      state.buf[msg.provider] += msg.text;
      state.status[msg.provider] = "streaming";
      pillFor(msg.provider)?.classList.remove("pending");
      // Fastest model wins the default tab
      if (!state.activeTab) setTab(msg.provider);
      ensureDrain();
      return;
    }

    if (msg.type === "done" || msg.type === "error") {
      if (msg.type === "error" && !state.answers[msg.provider] && !state.buf[msg.provider])
        state.answers[msg.provider] = `⚠ ${msg.message}`;
      // Finalized by the drain loop once the remaining buffer is typed out
      state.finished[msg.provider] = msg;
      pillFor(msg.provider)?.classList.remove("pending");
      if (!state.activeTab) setTab(msg.provider);
      ensureDrain();
    }
  }

  // ---------- Typewriter drain ----------
  function ensureDrain() {
    if (!drainTimer) drainTimer = setInterval(drainTick, TYPE_TICK_MS);
  }

  function stopDrain() {
    clearInterval(drainTimer);
    drainTimer = null;
  }

  function drainTick() {
    if (!state || !host) {
      stopDrain();
      return;
    }
    let typing = false;
    for (const p of state.providers) {
      const buf = state.buf[p.id];
      if (buf) {
        state.answers[p.id] += buf.slice(0, TYPE_CHARS_PER_TICK);
        state.buf[p.id] = buf.slice(TYPE_CHARS_PER_TICK);
        typing = true;
      } else if (state.finished[p.id]) {
        const msg = state.finished[p.id];
        delete state.finished[p.id];
        state.status[p.id] = msg.type;
        state.doneCount++;
        if (!state.firstDone) state.firstDone = msg.ms;
      }
    }
    render();
    // Idle (mid-stream lull or all finalized) — next chunk restarts the loop
    const pendingFinish = state.providers.some((p) => state.finished[p.id]);
    if (!typing && !pendingFinish) stopDrain();
  }

  function pillFor(id) {
    return host?.shadowRoot.querySelector(`.pill[data-id="${id}"]`);
  }

  function setTab(id) {
    state.activeTab = id;
    setCompare(false);
    for (const p of state.providers)
      pillFor(p.id)?.classList.toggle("on", p.id === id);
    render();
  }

  // Widen the card in compare view; clamp left edge so it stays on-screen.
  function setCompare(on) {
    state.compare = on;
    host?.shadowRoot.querySelector(".card")?.classList.toggle("wide", on);
    if (!host) return;
    if (on) {
      const maxLeft =
        window.scrollX + document.documentElement.clientWidth - COMPARE_W - 16;
      host.style.left = `${Math.max(8, Math.min(state.baseLeft, maxLeft))}px`;
    } else {
      host.style.left = `${state.baseLeft}px`;
    }
  }

  function render() {
    const root = host.shadowRoot;
    const body = root.querySelector(".body");

    const copyBtn = (id, label) =>
      `<button class="copy" data-copy="${id}" title="Copy" aria-label="Copy ${label} answer">${CLIP_SVG}</button>`;

    if (state.compare) {
      body.innerHTML = `<div class="cols">${state.providers
        .map(
          (p) => `
        <div class="col">
          <div class="lblrow"><span class="lbl">${p.label}</span>${copyBtn(p.id, p.label)}</div>
          <div class="ans">${esc(state.answers[p.id] || "…")}</div>
        </div>`
        )
        .join("")}</div>`; // no meta in compare view
    } else {
      const id = state.activeTab;
      const label = state.providers.find((p) => p.id === id)?.label || "";
      const streaming = state.status[id] === "streaming";
      body.innerHTML = `
        <div class="ans">${esc(state.answers[id] || "")}${
        streaming ? '<span class="caret"></span>' : ""
      }</div>
        <div class="metarow">
          <p class="meta"></p>
          ${copyBtn(id, label)}
        </div>`;
    }

    if (state.compare) return; // responded-time info hidden in compare view

    const total = state.providers.length;
    const meta = root.querySelector(".meta");
    if (state.doneCount === total && total > 0) {
      const secs = ((performance.now() - state.t0) / 1000).toFixed(1);
      meta.textContent = `✓ ${state.activeTab ? state.providers.find(p => p.id === state.activeTab)?.label : ""} responded · ${secs}s`;
    } else {
      meta.textContent = `${state.activeTab ? state.providers.find(p => p.id === state.activeTab)?.label : ""} responded · ${((performance.now() - state.t0) / 1000).toFixed(1)}s`;
    }
  }

  // ---------- Footer actions ----------
  function onFooter(e) {
    // closest(): the gear button's click target can be its inner SVG
    const btn = e.target?.closest?.("[data-act]");
    const act = btn?.dataset.act;
    if (!act) return;
    const root = host.shadowRoot;
    if (act === "compare") {
      setCompare(!state.compare);
      btn.textContent = state.compare ? "Single view" : "Compare all";
      if (state.compare)
        for (const p of state.providers) pillFor(p.id)?.classList.remove("on");
      else if (state.activeTab) pillFor(state.activeTab)?.classList.add("on");
      render();
    }
    if (act === "followup") {
      const fu = root.querySelector(".fu");
      fu.style.display = fu.style.display === "block" ? "none" : "block";
      fu.querySelector("input").focus();
    }
    if (act === "settings") {
      btn.classList.add("spin");
      btn.addEventListener(
        "animationend",
        () => btn.classList.remove("spin"),
        { once: true }
      );
      chrome.runtime.sendMessage({ type: "open-options" });
    }
  }

  function onCopyClick(e) {
    const btn = e.target?.closest?.("[data-copy]");
    if (!btn || !state) return;
    // Include text still queued in the typewriter buffer
    const id = btn.dataset.copy;
    navigator.clipboard.writeText(
      (state.answers[id] || "") + (state.buf[id] || "")
    );
    btn.innerHTML = CHECK_SVG;
    setTimeout(() => {
      if (btn.isConnected) btn.innerHTML = CLIP_SVG;
    }, 1200);
  }

  function runFollowUp(selection, question) {
    const root = host.shadowRoot;
    root.querySelector(".fu").style.display = "none";
    // Reset answers, keep pills; re-query with the follow-up as prompt override
    for (const p of state.providers) {
      state.answers[p.id] = "";
      state.buf[p.id] = "";
      state.status[p.id] = "pending";
    }
    state.finished = {};
    state.doneCount = 0;
    state.t0 = performance.now();
    setCompare(false);
    root.querySelector('[data-act="compare"]').textContent = "Compare all";
    port?.disconnect();
    startLookup(
      selection,
      "",
      `Regarding "${selection}": ${question}\nAnswer in 2-3 sentences.`
    );
    render();
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function dismiss() {
    stopDrain();
    port?.disconnect();
    port = null;
    host?.remove();
    host = null;
    state = null;
  }
})();
