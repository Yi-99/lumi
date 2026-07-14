import { useCallback, useRef, useState } from 'react'
import LumiCard from './LumiCard.jsx'

// The showcase's signature: a real article you can highlight, with a
// simulated lumi card popping up under the selection — the same idea as
// the extension's own preview.html harness.

const MIN_CHARS = 2
const MAX_CHARS = 120

function LookupDemo() {
  const containerRef = useRef(null)
  const articleRef = useRef(null)
  const [lookup, setLookup] = useState(null) // { selection, position }

  const handleSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString().trim()
    if (text.length < MIN_CHARS || text.length > MAX_CHARS) return
    if (!articleRef.current?.contains(sel.anchorNode)) return

    const rect = sel.getRangeAt(0).getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()
    const cardWidth = Math.min(368, containerRect.width - 16)
    const left = Math.min(
      Math.max(8, rect.left - containerRect.left + rect.width / 2 - cardWidth / 2),
      containerRect.width - cardWidth - 8,
    )
    setLookup({
      selection: text,
      position: { top: rect.bottom - containerRect.top + 10, left },
    })
  }, [])

  const dismiss = useCallback(() => setLookup(null), [])

  return (
    <div ref={containerRef} className="relative">
      <figure className="rounded-2xl border border-white/10 bg-paper p-6 shadow-2xl shadow-night-950/60 sm:p-10">
        <figcaption className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-4">
          <span className="font-sans text-[11px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
            Field Notes · Marine Biology
          </span>
          <span className="rounded-full bg-glow/60 px-2.5 py-1 font-sans text-[11px] font-semibold text-ink">
            Try it — highlight any word below
          </span>
        </figcaption>
        <article
          ref={articleRef}
          onPointerUp={handleSelection}
          className="cursor-text font-serif text-lg leading-relaxed text-ink/90 sm:text-xl"
        >
          <h3 className="mb-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
            The ocean makes its own light
          </h3>
          <p className="mb-4">
            In the abyssal dark, where sunlight gives out long before the seafloor begins,
            most of the light that exists is made by the creatures themselves. This is{' '}
            bioluminescence: a chemical reaction in which a molecule called luciferin is
            oxidized with the help of the enzyme luciferase, releasing energy as cold light
            instead of heat.
          </p>
          <p>
            Animals put the glow to remarkably practical use. The hatchetfish hides by
            shining — its belly photophores match the faint light from above, a trick known
            as counterillumination that erases its silhouette from predators below. Nearer
            the surface, swarms of dinoflagellates flash blue when disturbed, which is why a
            boat&rsquo;s wake can burn like a comet on a moonless night.
          </p>
        </article>
      </figure>

      {lookup && (
        <LumiCard
          key={lookup.selection + lookup.position.top}
          selection={lookup.selection}
          position={lookup.position}
          onDismiss={dismiss}
        />
      )}
    </div>
  )
}

export default LookupDemo
