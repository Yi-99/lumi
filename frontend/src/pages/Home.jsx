import Reveal from '../components/Reveal.jsx'
import DemoCard from '../components/DemoCard.jsx'
import Faq from '../components/Faq.jsx'
import historyShot from '../assets/card-thread-history.png'

const MARQUEE_ITEMS = ['DEFINE', 'ASK FOLLOW-UPS', 'SAVE EVERYTHING', 'READ WITHOUT STOPPING']

const FEATURES = [
  {
    n: '01',
    title: 'Instant definitions',
    body: 'Highlight anything, anywhere. Lumi returns a clear, contextual meaning — not a wall of dictionary jargon.',
  },
  {
    n: '02',
    title: 'Ask AI follow-ups',
    body: '“Where does it come from?” “Give me an antonym.” Keep a real conversation going until it truly clicks.',
  },
  {
    n: '03',
    title: 'Every lookup, saved',
    body: 'A searchable history of every prompt and word — your personal, ever-growing vocabulary.',
  },
]

const STEPS = [
  {
    label: 'STEP 01',
    glyph: '↯',
    title: 'Highlight a word',
    body: "Anywhere you read — Lumi's cursor is always one tap away.",
  },
  {
    label: 'STEP 02',
    glyph: '✦',
    title: 'Read the meaning',
    body: "A crisp definition appears instantly, tuned to the sentence you're in.",
  },
  {
    label: 'STEP 03',
    glyph: '∞',
    title: 'Ask anything more',
    body: 'Follow the thread with AI, then find it again in your saved history.',
  },
]

const STATS = [
  { value: '0.4s', label: 'avg. lookup speed' },
  { value: '∞', label: 'follow-up questions' },
  { value: '100%', label: 'of it, remembered' },
]

function MarqueeRun() {
  return (
    <>
      {MARQUEE_ITEMS.map((item) => (
        <span key={item}>
          <span className="px-7">{item}</span>
          <span className="px-7 text-[#666]">✦</span>
        </span>
      ))}
    </>
  )
}

function Home() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="border-b border-black px-5 pt-[150px] pb-[60px] sm:px-10">
        <div className="mx-auto max-w-[1360px]">
          <Reveal className="mb-8 font-mono text-xs tracking-[0.28em] uppercase">
            AI dictionary · Est. 2026
          </Reveal>
          <Reveal
            as="h1"
            delay={60}
            className="font-display m-0 text-[clamp(44px,12.5vw,182px)] leading-[0.84] tracking-[-0.045em] text-balance"
          >
            EVERY
            <br />
            WORD,
            <br />
            ANSWERED.
          </Reveal>
          <div className="mt-12 flex flex-wrap items-end justify-between gap-10">
            <Reveal
              as="p"
              delay={140}
              className="m-0 max-w-[560px] text-[clamp(18px,2vw,23px)] leading-normal"
            >
              Lumi defines any word the moment you meet it — then lets you ask AI anything
              that follows. Reading shouldn&rsquo;t stop for a dictionary.
            </Reveal>
            <Reveal delay={200} className="flex flex-wrap gap-3">
              <a
                href="#demo"
                className="inline-flex items-center gap-3 bg-black px-6 py-4 font-mono text-sm tracking-[0.06em] whitespace-nowrap text-white transition-transform duration-200 hover:translate-x-[3px] hover:-translate-y-[3px]"
              >
                DEFINE A WORD ↗
              </a>
              <a
                href="#how"
                className="inline-flex items-center border border-black px-6 py-4 font-mono text-sm tracking-[0.06em] whitespace-nowrap transition-colors duration-200 hover:bg-black hover:text-white"
              >
                SEE HOW
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* marquee */}
      <div className="overflow-hidden border-b border-black bg-black py-4 whitespace-nowrap text-white">
        <div className="animate-marquee font-display inline-block text-[26px] tracking-[-0.01em]">
          <MarqueeRun />
          <MarqueeRun />
        </div>
      </div>

      {/* ============ LIVE DEMO ============ */}
      <section id="demo" className="scroll-mt-20 border-b border-black px-5 py-20 sm:px-10">
        <div className="mx-auto max-w-[1360px]">
          <Reveal>
            <DemoCard />
          </Reveal>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="scroll-mt-20">
        <Reveal className="mx-auto max-w-[1360px] px-5 pt-14 pb-2 font-mono text-xs tracking-[0.28em] uppercase sm:px-10">
          § What Lumi does
        </Reveal>
        <div className="mx-auto max-w-[1360px] px-5 pb-10 sm:px-10">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.n}
              delay={30 + i * 40}
              className={`grid cursor-default grid-cols-[64px_1fr] border-t border-black transition-colors duration-[250ms] hover:bg-black hover:text-white sm:grid-cols-[110px_1fr] ${
                i === FEATURES.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="font-display py-10 pl-1 text-2xl sm:text-[32px]">{f.n}</div>
              <div className="flex items-center justify-between gap-10 py-10">
                <div>
                  <div className="text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[-0.015em]">
                    {f.title}
                  </div>
                  <p className="mt-2.5 mb-0 max-w-[600px] text-lg opacity-75">{f.body}</p>
                </div>
                <span className="hidden font-mono text-[38px] sm:block">→</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="scroll-mt-20 bg-black px-5 py-[90px] text-white sm:px-10">
        <div className="mx-auto max-w-[1360px]">
          <Reveal className="mb-5 font-mono text-xs tracking-[0.28em] text-[#888] uppercase">
            § How it works
          </Reveal>
          <Reveal
            as="h2"
            delay={40}
            className="font-display mt-0 mb-14 text-[clamp(40px,7vw,92px)] leading-[0.92] tracking-[-0.035em]"
          >
            THREE STEPS.
            <br />
            ZERO FRICTION.
          </Reveal>
          <div className="grid border-t border-[#333] md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal
                key={s.label}
                delay={40 + i * 50}
                className={`border-b border-[#333] py-10 md:border-b-0 ${
                  i < 2 ? 'md:border-r md:border-[#333] md:pr-8' : ''
                } ${i === 1 ? 'md:px-8' : ''} ${i === 2 ? 'md:pl-8' : ''}`}
              >
                <div className="font-mono text-[13px] text-[#888]">{s.label}</div>
                <div className="font-display my-4 text-6xl">{s.glyph}</div>
                <div className="mb-2.5 text-2xl font-bold">{s.title}</div>
                <p className="m-0 text-base leading-relaxed text-[#b4b4b4]">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="border-b border-black">
        <div className="mx-auto grid max-w-[1360px] sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 60}
              className={`border-b border-black px-10 py-14 text-center sm:border-b-0 ${
                i < 2 ? 'sm:border-r sm:border-black' : ''
              }`}
            >
              <div className="font-display text-[clamp(48px,7vw,88px)] leading-none tracking-[-0.03em]">
                {s.value}
              </div>
              <div className="mt-3.5 font-mono text-xs tracking-[0.12em] uppercase">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ HISTORY ============ */}
      <section id="history" className="scroll-mt-20 border-b border-black px-5 py-20 sm:px-10">
        <div className="mx-auto grid max-w-[1360px] items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="mb-5 font-mono text-xs tracking-[0.28em] uppercase">§ History</div>
            <h2 className="font-display m-0 text-[clamp(40px,5.4vw,68px)] leading-[0.94] tracking-[-0.035em]">
              A DIARY OF EVERYTHING YOU LOOKED UP.
            </h2>
            <p className="mt-6 mb-0 max-w-[460px] text-[19px] leading-[1.55]">
              Scroll back through weeks of curiosity. Re-open any thread and keep asking —
              nothing you learn slips away.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5 font-mono text-[13px]">
              {['luminous', 'ephemeral', 'serendipity', '+ 214 more'].map((w) => (
                <span key={w} className="border border-black px-3.5 py-2">
                  {w}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <img
              src={historyShot}
              alt="Lumi history panel showing a saved lookup thread"
              loading="lazy"
              className="w-full border border-black"
            />
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="scroll-mt-20 border-b border-black px-5 py-20 sm:px-10">
        <div className="mx-auto max-w-[1360px]">
          <Reveal className="mb-8 font-mono text-xs tracking-[0.28em] uppercase">
            § Questions
          </Reveal>
          <Faq />
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section id="cta" className="bg-black px-5 py-[120px] text-center text-white sm:px-10">
        <Reveal className="font-display text-[clamp(40px,11vw,150px)] leading-[0.86] tracking-[-0.045em]">
          START
          <br />
          LOOKING UP.
        </Reveal>
        <Reveal
          as="p"
          delay={80}
          className="mx-auto mt-7 mb-0 max-w-[440px] text-xl text-[#b4b4b4]"
        >
          Free to start. Every word you meet, understood in a breath.
        </Reveal>
        <Reveal delay={140} className="mt-9">
          <a
            href="https://github.com/Yi-99/lumi"
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-white px-8 py-4 font-mono text-sm tracking-[0.08em] text-black transition-transform duration-200 hover:scale-105"
          >
            GET LUMI FREE ↗
          </a>
        </Reveal>
      </section>
    </>
  )
}

export default Home
