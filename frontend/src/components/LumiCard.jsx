import { useEffect, useRef, useState } from 'react'

// Simulated lookup card, styled after the real extension card
// (extension/content.js): paper surface, 12px radius, provider pills,
// system font. Streams canned answers at per-provider speeds — the first
// provider to finish wins the default tab, exactly like the extension.

const GLOSSARY = {
  bioluminescence:
    'the production of visible light by a living organism through a chemical reaction. In this passage it names the phenomenon the whole paragraph describes: deep-sea creatures generating their own glow where sunlight cannot reach.',
  luciferin:
    'the light-emitting molecule in bioluminescent reactions. When it is oxidized — here with the enzyme luciferase as catalyst — the energy released escapes as photons rather than heat, which is why the passage calls the glow "cold light".',
  luciferase:
    'the enzyme that catalyzes the oxidation of luciferin. In this passage it is the second half of the chemical pair responsible for the glow: luciferin provides the light, luciferase makes the reaction happen.',
  counterillumination:
    'a camouflage strategy where an animal matches the faint light falling from above by glowing on its underside, erasing its own silhouette. The passage cites the hatchetfish as an example of hiding by emitting light rather than avoiding it.',
  hatchetfish:
    'a small deep-sea fish with a thin, silvery body and downward-pointing light organs. The passage uses it as the textbook example of counterillumination — its belly glows just enough to cancel its silhouette against the surface light.',
  dinoflagellates:
    'single-celled marine plankton, some of which flash blue when the water around them is disturbed. In this passage they are the reason a boat’s wake can light up at night.',
  photophores:
    'specialized light-producing organs, arranged like rows of tiny lanterns on the bodies of many deep-sea animals. The passage mentions them as the anatomical source of the glow.',
  abyssal:
    'belonging to the deepest zone of the ocean, roughly below 3,000 meters, where no sunlight penetrates. In this passage it sets the scene: a habitat where the only light is the light life makes.',
}

function answerFor(selection) {
  const key = selection.trim().toLowerCase().replace(/[.,;:!?"'’“”]/g, '')
  const base = GLOSSARY[key]
  if (base) return `In this passage, “${selection.trim()}” means ${base}`
  return (
    `“${selection.trim()}” — as used in this passage about deep-sea light, ` +
    `this refers to part of the description of how organisms produce and use their own glow. ` +
    `Highlighted in context, it reads as a detail supporting the paragraph’s main idea: ` +
    `in the deep ocean, light is something life makes for itself. ` +
    `(This is a scripted demo — the real extension streams live answers from each provider.)`
  )
}

const PROVIDERS = [
  { id: 'claude', label: 'Claude', speed: 95, delay: 250, voice: (s) => answerFor(s) },
  {
    id: 'gpt',
    label: 'GPT-4o',
    speed: 70,
    delay: 420,
    voice: (s) => `Here’s what that means in context. ${answerFor(s)}`,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    speed: 55,
    delay: 600,
    voice: (s) => `Quick answer: ${answerFor(s)}`,
  },
]

function LumiCard({ selection, position, onDismiss }) {
  const [streams, setStreams] = useState(() =>
    Object.fromEntries(PROVIDERS.map((p) => [p.id, { text: '', done: false }])),
  )
  const [activeTab, setActiveTab] = useState(null)
  const [copied, setCopied] = useState(false)
  const userPickedTab = useRef(false)
  const cardRef = useRef(null)

  // Stream each provider at its own pace; first to finish wins the tab.
  useEffect(() => {
    const timers = []
    PROVIDERS.forEach((p) => {
      const full = p.voice(selection)
      let i = 0
      const start = setTimeout(() => {
        const tick = setInterval(() => {
          i += Math.max(1, Math.round(p.speed / 30))
          const done = i >= full.length
          setStreams((prev) => ({
            ...prev,
            [p.id]: { text: full.slice(0, i), done },
          }))
          if (done) {
            clearInterval(tick)
            if (!userPickedTab.current) {
              setActiveTab((cur) => cur ?? p.id)
            }
          }
        }, 33)
        timers.push(tick)
      }, p.delay)
      timers.push(start)
    })
    return () => timers.forEach(clearTimeout)
  }, [selection])

  // Esc, outside click, or scrolling dismisses — same as the extension.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onDismiss()
    const onPointerDown = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) onDismiss()
    }
    let scrollStart = null
    const onScroll = () => {
      if (scrollStart === null) scrollStart = window.scrollY
      if (Math.abs(window.scrollY - scrollStart) > 48) onDismiss()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', onScroll)
    }
  }, [onDismiss])

  const shownTab = activeTab ?? PROVIDERS[0].id
  const shown = streams[shownTab]
  const anyStarted = Object.values(streams).some((s) => s.text.length > 0)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable — nothing to do in a demo */
    }
  }

  return (
    <div
      ref={cardRef}
      className="animate-card-in absolute z-30 w-[min(23rem,calc(100%-1rem))] rounded-xl border border-black/5 bg-white text-ink shadow-[0_8px_24px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.08)]"
      style={{ top: position.top, left: position.left, fontFamily: 'var(--font-system)' }}
      role="dialog"
      aria-label={`Lookup: ${selection}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3.5 pt-3 pb-2.5">
        <span className="truncate text-[13px] font-semibold">&ldquo;{selection}&rdquo;</span>
        <span className="flex shrink-0 gap-1.5">
          {PROVIDERS.map((p) => {
            const st = streams[p.id]
            const on = shownTab === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  userPickedTab.current = true
                  setActiveTab(p.id)
                }}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] leading-relaxed transition ${
                  on
                    ? 'border-ink bg-ink text-white'
                    : 'border-black/15 text-neutral-500 hover:border-black/30'
                } ${st.text.length === 0 ? 'opacity-45' : ''}`}
              >
                {p.label}
              </button>
            )
          })}
        </span>
      </div>

      <div className="min-h-[4.5rem] px-3.5 py-3 text-[13px] leading-relaxed text-neutral-800">
        {anyStarted ? (
          <p>
            {shown.text}
            {!shown.done && <span className="animate-caret text-amber-core">▍</span>}
          </p>
        ) : (
          <div className="space-y-2 py-1" aria-hidden="true">
            <div className="h-2.5 w-[85%] animate-pulse rounded bg-black/5" />
            <div className="h-2.5 w-[70%] animate-pulse rounded bg-black/5" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-black/5 px-3.5 py-2">
        <span className="text-[11px] text-neutral-400">
          Esc to dismiss · demo streams are scripted
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-black/10 px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition hover:bg-black/5"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default LumiCard
