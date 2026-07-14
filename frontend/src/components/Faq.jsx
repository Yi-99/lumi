import { useState } from 'react'
import Reveal from './Reveal.jsx'

const FAQS = [
  {
    q: 'Where can I use Lumi?',
    a: "Anywhere you read on your device — articles, PDFs, books, the web. Highlight a word and Lumi's definition appears without leaving the page.",
  },
  {
    q: 'How is this different from a normal dictionary?',
    a: 'A dictionary gives you one fixed entry. Lumi reads the sentence around the word, explains it in context, and then answers whatever you ask next in plain language.',
  },
  {
    q: 'What kind of follow-ups can I ask?',
    a: "Anything — etymology, simpler phrasing, antonyms, an example sentence, or how the meaning shifts in a specific context. It's a real conversation, not a lookup.",
  },
  {
    q: 'Is my history private?',
    a: 'Yes. Your saved words and prompts are yours alone, searchable only by you, and never used to identify you.',
  },
]

function Faq() {
  const [open, setOpen] = useState(null)

  return (
    <div className="border-t border-black">
      {FAQS.map((f, i) => {
        const isOpen = open === i
        return (
          <Reveal key={f.q}>
            <div
              className="cursor-pointer border-b border-black transition-colors duration-200 hover:bg-black hover:text-white"
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-8 px-1 py-7 text-left"
              >
                <span className="text-[clamp(20px,2.4vw,28px)] font-bold tracking-tight">
                  {f.q}
                </span>
                <span className="shrink-0 font-mono text-3xl">{isOpen ? '−' : '+'}</span>
              </button>
              <div
                className="overflow-hidden transition-[max-height] duration-400 ease-in-out"
                style={{ maxHeight: isOpen ? '260px' : '0px' }}
              >
                <p className="m-0 px-1 pr-14 pb-8 text-lg leading-[1.55] opacity-80">{f.a}</p>
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

export default Faq
