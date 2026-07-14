import { useEffect, useState } from 'react'

// The design's live-demo card, made real: pick a follow-up chip and the
// answer types itself out terminal-style.
const FOLLOW_UPS = [
  {
    label: 'Use it in a sentence',
    q: 'use it in a sentence',
    a: '“Her luminous prose lit up even the dullest subject.”',
  },
  {
    label: 'Etymology?',
    q: 'etymology?',
    a: 'From Latin lumen, “light” — via luminosus, “full of light”, arriving in English in the 15th century.',
  },
  {
    label: 'Simpler, please',
    q: 'simpler, please',
    a: 'Glowing — something that gives off light, or an idea explained so clearly it feels bright.',
  },
  {
    label: 'Antonyms',
    q: 'antonyms',
    a: 'dim · dull · murky · obscure — words for light, and for prose, that fail to glow.',
  },
]

function DemoCard() {
  const [active, setActive] = useState(0)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    const full = FOLLOW_UPS[active].a
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(full)
      return undefined
    }
    setTyped('')
    let i = 0
    const tick = setInterval(() => {
      i += 2
      setTyped(full.slice(0, i))
      if (i >= full.length) clearInterval(tick)
    }, 28)
    return () => clearInterval(tick)
  }, [active])

  return (
    <div className="border border-black bg-white px-6 py-8 sm:px-12 sm:py-11">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span className="font-display text-[clamp(38px,6vw,66px)] leading-none tracking-tight">
          lumin·ous
        </span>
        <span className="font-mono text-lg text-[#555]">/ˈluːmɪnəs/ · adjective</span>
      </div>

      <p className="mt-5 mb-0 max-w-[820px] text-[clamp(19px,2.2vw,26px)] leading-[1.45]">
        Emitting or reflecting light; radiant.{' '}
        <span className="text-[#888]">Also: intellectually brilliant, illuminating.</span>
      </p>

      <div className="mt-7 flex flex-wrap gap-2.5 font-mono text-[13px]">
        {FOLLOW_UPS.map((f, i) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setActive(i)}
            className={`border border-black px-4 py-2.5 transition-colors duration-200 ${
              active === i ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-7 border-t border-dashed border-[#bbb] pt-5 font-mono text-[15px] text-[#333]">
        <span className="text-[#888]">&gt; you asked:</span> {FOLLOW_UPS[active].q}
        <br />
        <span className="text-black">&gt; lumi:</span> {typed}
        <span className="animate-blink ml-1 inline-block h-4 w-[9px] bg-black align-middle" />
      </div>
    </div>
  )
}

export default DemoCard
