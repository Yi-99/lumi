import { Link } from 'react-router-dom'
import LookupDemo from '../components/LookupDemo.jsx'
import LumiStar from '../components/LumiStar.jsx'
import cardCompare from '../assets/card-compare.png'
import cardDark from '../assets/card-dark.png'
import optionsShot from '../assets/options.png'

function Kbd({ children }) {
  return (
    <kbd className="rounded-md border border-white/20 bg-white/5 px-1.5 py-0.5 font-mono text-[0.8em] text-fog">
      {children}
    </kbd>
  )
}

function Eyebrow({ children }) {
  return (
    <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-amber-core uppercase">
      {children}
    </p>
  )
}

const SPARKLES = [
  { top: '14%', left: '8%', size: 'h-4 w-4', delay: '0s' },
  { top: '22%', left: '88%', size: 'h-6 w-6', delay: '1.2s' },
  { top: '55%', left: '4%', size: 'h-3 w-3', delay: '2.1s' },
  { top: '10%', left: '55%', size: 'h-3 w-3', delay: '0.7s' },
  { top: '48%', left: '94%', size: 'h-4 w-4', delay: '2.8s' },
]

const STEPS = [
  {
    n: '1',
    title: 'Highlight',
    body: (
      <>
        Select a word or phrase on any webpage, or press <Kbd>⌘⇧L</Kbd> /{' '}
        <Kbd>Ctrl+Shift+L</Kbd>. lumi sends the selection plus its surrounding paragraph, so
        answers fit the passage — not a generic dictionary entry.
      </>
    ),
  },
  {
    n: '2',
    title: 'Every model answers at once',
    body: (
      <>
        A card pops up under your selection and queries Claude, GPT-4o, and Gemini in
        parallel, streaming tokens live as each one responds.
      </>
    ),
  },
  {
    n: '3',
    title: 'Fastest wins the tab',
    body: (
      <>
        The first model to finish takes the default tab. Switch models with the pills in the
        header, or click <em>Compare all</em> to read every answer side by side.
      </>
    ),
  },
]

const FEATURES = [
  {
    title: 'Follow-up threads',
    body: 'Ask a question about the selection and the card becomes a thread — earlier answers stay visible while the new one streams in below.',
  },
  {
    title: 'Prompt history',
    body: 'With the optional local proxy running, every lookup and follow-up is saved to a SQLite database on your machine, browsable from the card.',
  },
  {
    title: 'Encrypted key vault',
    body: 'API keys are encrypted at rest with AES-GCM-256 behind a non-extractable WebCrypto master key. They never sync and never leave your device.',
  },
  {
    title: 'Token usage meter',
    body: 'The settings page tallies input and output tokens per provider, parsed from each provider’s own streaming usage reports — so you know what each key costs.',
  },
  {
    title: 'Optional local proxy',
    body: 'A dockerized FastAPI server can handle the provider fan-out on your machine. If it’s down, the extension silently falls back to direct calls.',
  },
  {
    title: 'No build, no cloud',
    body: 'Plain JavaScript, Manifest V3, MIT licensed. There is no lumi server: your selections go straight to the providers you enable, and nowhere else.',
  },
]

const PROVIDERS = [
  { name: 'Claude', model: 'claude-sonnet-4-6', key: 'sk-ant-…', url: 'https://console.anthropic.com/', host: 'console.anthropic.com' },
  { name: 'GPT-4o', model: 'gpt-4o-mini', key: 'sk-…', url: 'https://platform.openai.com/api-keys', host: 'platform.openai.com' },
  { name: 'Gemini', model: 'gemini-2.0-flash', key: 'AIza…', url: 'https://aistudio.google.com/apikey', host: 'aistudio.google.com' },
]

const SHOWCASE = [
  {
    eyebrow: 'Compare',
    title: 'Three answers, one glance',
    body: 'Click Compare all and every model’s answer lines up in columns. Different models disagree more often than you’d think — lumi makes the disagreement visible instead of hiding it behind one confident voice.',
    img: cardCompare,
    alt: 'Compare view with Claude, GPT-4o, and Gemini answers in three columns',
  },
  {
    eyebrow: 'Dark mode',
    title: 'Made for midnight reading',
    body: 'The card follows your system theme automatically, or force light or dark from the settings page. Either way it renders in a shadow DOM, so the pages you visit can’t restyle it — and it can’t disturb them.',
    img: cardDark,
    alt: 'Lookup card in dark mode',
  },
  {
    eyebrow: 'Your keys, your costs',
    title: 'Bring your own API keys',
    body: 'Paste a key for at least one provider and untick the ones you don’t want without deleting anything. The usage meter shows tokens in, tokens out, and lookup counts per provider, with a reset button.',
    img: optionsShot,
    alt: 'Settings popup with API key fields for Claude, GPT-4o, and Gemini',
  },
]

function Home() {
  return (
    <>
      {/* Hero — the pitch, then the product itself: highlight the article. */}
      <section className="relative overflow-hidden px-4 pt-36 pb-20 sm:pt-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_32rem_at_50%_-8rem,rgba(49,46,129,0.55),transparent)]"
        />
        {SPARKLES.map((s, i) => (
          <LumiStar
            key={i}
            className={`animate-twinkle pointer-events-none absolute ${s.size}`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          />
        ))}

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-mist">
            <LumiStar className="h-3.5 w-3.5" />
            Free, open-source Chrome extension
          </p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-fog sm:text-6xl md:text-7xl">
            Highlight <span className="hl-mark text-ink">anything</span>.
            <br />
            Understand it in place.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-mist">
            lumi puts a macOS Lookup-style card under any text you select, with answers from
            Claude, GPT-4o, and Gemini streamed side by side. No tab-switching, no pasting
            into a chat window.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#install"
              className="rounded-xl bg-gradient-to-b from-glow to-amber-core px-6 py-3 font-semibold text-ink shadow-lg shadow-amber-core/25 transition-transform hover:scale-[1.03]"
            >
              Install lumi
            </a>
            <a
              href="https://github.com/Yi-99/lumi"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-fog transition-colors hover:bg-white/5"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <LookupDemo />
          <p className="mt-4 text-center text-sm text-mist">
            This page is the demo: select a word in the article above and a card appears —
            in the extension, this works on every website, with <Kbd>⌘⇧L</Kbd> for longer
            passages.
          </p>
        </div>
      </section>

      {/* How it works — a real three-step sequence. */}
      <section id="features" className="scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight text-fog sm:text-4xl">
            From selection to answer in one gesture
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="rounded-2xl border border-white/10 bg-night-800/60 p-6"
              >
                <span className="font-display text-sm font-bold text-amber-core">
                  Step {step.n}
                </span>
                <h3 className="mt-2 mb-2 font-display text-xl font-semibold text-fog">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-mist">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Screenshots — the real card, not an illustration of it. */}
      <section className="px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-20">
          {SHOWCASE.map((item, i) => (
            <div
              key={item.title}
              className={`flex flex-col items-center gap-8 md:gap-14 ${
                i % 2 ? 'md:flex-row-reverse' : 'md:flex-row'
              }`}
            >
              <div className="md:w-2/5">
                <Eyebrow>{item.eyebrow}</Eyebrow>
                <h2 className="font-display text-2xl font-bold tracking-tight text-fog sm:text-3xl">
                  {item.title}
                </h2>
                <p className="mt-4 leading-relaxed text-mist">{item.body}</p>
              </div>
              <div className="md:w-3/5">
                <img
                  src={item.img}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full rounded-2xl border border-white/10 shadow-2xl shadow-night-950/60"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid. */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <Eyebrow>Everything else</Eyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight text-fog sm:text-4xl">
            Small card, complete tool
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-night-800/60 p-6">
                <h3 className="mb-2 font-display text-lg font-semibold text-fog">{f.title}</h3>
                <p className="text-sm leading-relaxed text-mist">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy strip. */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-amber-core/25 bg-gradient-to-br from-night-800 to-indigo-brand/40 p-8 sm:p-12">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
            <LumiStar glow className="h-20 w-20 shrink-0" />
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-fog sm:text-3xl">
                Your keys never leave your machine
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-mist">
                Keys are encrypted at rest and sent only to each provider&rsquo;s official
                API endpoint. There is no lumi cloud, no analytics, and no tracking — the
                optional proxy and its history database run on your own hardware.
              </p>
              <Link
                to="/privacy"
                className="mt-5 inline-block rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-fog transition-colors hover:bg-white/5"
              >
                Read the privacy policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Install. */}
      <section id="install" className="scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <Eyebrow>Install</Eyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight text-fog sm:text-4xl">
            Load it unpacked, add a key, done
          </h2>
          <p className="mt-3 max-w-2xl text-mist">
            lumi isn&rsquo;t on the Chrome Web Store yet — it takes about two minutes to load
            in Chrome or any Chromium browser.
          </p>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <ol className="space-y-5">
              {[
                <>
                  Clone the repository:
                  <code className="mt-2 block overflow-x-auto rounded-lg bg-night-950 px-3 py-2 font-mono text-sm text-fog">
                    git clone https://github.com/Yi-99/lumi.git
                  </code>
                </>,
                <>
                  Open <code className="font-mono text-fog">chrome://extensions</code> and turn on{' '}
                  <strong className="text-fog">Developer mode</strong> (top right).
                </>,
                <>
                  Click <strong className="text-fog">Load unpacked</strong> and select the{' '}
                  <code className="font-mono text-fog">lumi/extension</code> folder.
                </>,
                <>
                  Click the extension icon and paste an API key for at least one provider.
                  Highlight something — that&rsquo;s it.
                </>,
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-core font-display text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <div className="text-sm leading-relaxed text-mist">{step}</div>
                </li>
              ))}
            </ol>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-night-800/80 text-xs tracking-wider text-mist uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Key looks like</th>
                    <th className="px-4 py-3 font-semibold">Get a key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-mist">
                  {PROVIDERS.map((p) => (
                    <tr key={p.name}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-fog">{p.name}</span>
                        <span className="block font-mono text-xs text-mist/70">{p.model}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{p.key}</td>
                      <td className="px-4 py-3">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-core underline-offset-2 hover:underline"
                        >
                          {p.host}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
