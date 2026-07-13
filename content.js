// content.js — selection → Lookup-style card (shadow DOM, page-CSS-proof)
(() => {
  let host = null; // <div> host element carrying the shadow root
  let port = null; // chrome.runtime Port for the in-flight lookup
  let state = null; // { providers, answers, doneCount, firstDone, activeTab }

  const CARD_W = 380;

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

  document.addEventListener("scroll", () => dismiss(), { passive: true });
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
    };

    host = document.createElement("div");
    host.style.cssText =
      "all:initial; position:absolute; z-index:2147483647; width:0; height:0;";
    const top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;
    left = Math.min(left, window.scrollX + document.documentElement.clientWidth - CARD_W - 16);
    host.style.top = `${top}px`;
    host.style.left = `${Math.max(8, left)}px`;
    document.documentElement.appendChild(host);

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
        }
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
        .btn.right { margin-left: auto; }
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
          .caret { background: rgba(255,255,255,0.4); }
          .ans.skeleton::after { background: rgba(255,255,255,0.08); }
          .fu input { background: #1f1f1d; border-color: rgba(255,255,255,0.25); }
          .col { border-color: rgba(255,255,255,0.08); }
          .err { color: #f09595; }
        }
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
          <button class="btn right" data-act="copy">Copy</button>
        </div>
        <div class="fu"><input type="text" placeholder="Ask a follow-up about this…" /></div>
      </div>`;

    root.querySelector(".term").textContent = selectionText;
    root.querySelector(".ftr").addEventListener("click", onFooter);
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
      root.querySelector(".ans").classList.remove("skeleton");
      root.querySelector(".ans").innerHTML =
        `<span class="err">No API keys set. Open the extension settings to add keys for Claude, GPT, or Gemini.</span>`;
      root.querySelector(".meta").textContent = "";
      return;
    }

    if (msg.type === "providers") {
      state.providers = msg.providers;
      const pills = root.querySelector(".pills");
      pills.innerHTML = "";
      for (const p of msg.providers) {
        state.answers[p.id] = "";
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
      state.answers[msg.provider] += msg.text;
      state.status[msg.provider] = "streaming";
      pillFor(msg.provider)?.classList.remove("pending");
      // Fastest model wins the default tab
      if (!state.activeTab) setTab(msg.provider);
      if (state.activeTab === msg.provider || state.compare) render();
      return;
    }

    if (msg.type === "done" || msg.type === "error") {
      state.status[msg.provider] = msg.type;
      if (msg.type === "error")
        state.answers[msg.provider] =
          state.answers[msg.provider] || `⚠ ${msg.message}`;
      state.doneCount++;
      if (!state.firstDone) state.firstDone = msg.ms;
      pillFor(msg.provider)?.classList.remove("pending");
      if (!state.activeTab) setTab(msg.provider);
      render();
    }
  }

  function pillFor(id) {
    return host?.shadowRoot.querySelector(`.pill[data-id="${id}"]`);
  }

  function setTab(id) {
    state.activeTab = id;
    state.compare = false;
    for (const p of state.providers)
      pillFor(p.id)?.classList.toggle("on", p.id === id);
    render();
  }

  function render() {
    const root = host.shadowRoot;
    const body = root.querySelector(".body");

    if (state.compare) {
      body.innerHTML = `<div class="cols">${state.providers
        .map(
          (p) => `
        <div class="col">
          <div class="lbl">${p.label}</div>
          <div class="ans">${esc(state.answers[p.id] || "…")}</div>
        </div>`
        )
        .join("")}</div><p class="meta"></p>`;
    } else {
      const id = state.activeTab;
      const streaming = state.status[id] === "streaming";
      body.innerHTML = `
        <div class="ans">${esc(state.answers[id] || "")}${
        streaming ? '<span class="caret"></span>' : ""
      }</div>
        <p class="meta"></p>`;
    }

    const total = state.providers.length;
    const meta = root.querySelector(".meta");
    if (state.doneCount === total && total > 0) {
      const secs = ((performance.now() - state.t0) / 1000).toFixed(1);
      meta.textContent = `✓ ${state.doneCount} of ${total} models responded · ${secs}s`;
    } else {
      meta.textContent = `${state.doneCount} of ${total} models responded…`;
    }
  }

  // ---------- Footer actions ----------
  function onFooter(e) {
    const act = e.target?.dataset?.act;
    if (!act) return;
    const root = host.shadowRoot;
    if (act === "compare") {
      state.compare = !state.compare;
      e.target.textContent = state.compare ? "Single view" : "Compare all";
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
    if (act === "copy") {
      const text = state.compare
        ? state.providers
            .map((p) => `${p.label}:\n${state.answers[p.id]}`)
            .join("\n\n")
        : state.answers[state.activeTab] || "";
      navigator.clipboard.writeText(text);
      e.target.textContent = "Copied";
      setTimeout(() => (e.target.textContent = "Copy"), 1200);
    }
  }

  function runFollowUp(selection, question) {
    const root = host.shadowRoot;
    root.querySelector(".fu").style.display = "none";
    // Reset answers, keep pills; re-query with the follow-up as prompt override
    for (const p of state.providers) {
      state.answers[p.id] = "";
      state.status[p.id] = "pending";
    }
    state.doneCount = 0;
    state.t0 = performance.now();
    state.compare = false;
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
    port?.disconnect();
    port = null;
    host?.remove();
    host = null;
    state = null;
  }
})();
