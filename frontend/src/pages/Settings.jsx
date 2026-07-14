import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Settings page from Settings.dc.html: soft app-UI surface with its own
// light/dark token set (.settings-scope in index.css), sidebar tabs, and
// four panels. Keys and preferences persist to localStorage — the page's
// own copy promises "stored only in this browser".

const STORAGE_KEY = 'lumi-settings'

const PROVIDERS = [
  { id: 'claude', name: 'Claude', vendor: 'Anthropic', mono: 'C', placeholder: 'sk-ant-api03-…' },
  { id: 'gpt4o', name: 'GPT-4o', vendor: 'OpenAI', mono: 'G', placeholder: 'sk-…' },
  { id: 'gemini', name: 'Gemini', vendor: 'Google DeepMind', mono: 'G', placeholder: 'AIza…' },
]

const USAGE = [
  { name: 'Claude', inTok: 412, outTok: 201 },
  { name: 'GPT-4o', inTok: 246, outTok: 142 },
  { name: 'Gemini', inTok: 158, outTok: 83 },
]

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Icon = {
  key: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...STROKE}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3 21 2" />
      <path d="m16 6 3 3" />
      <path d="m18 4 3 3" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...STROKE}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  sliders: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...STROKE}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...STROKE}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...STROKE}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...STROKE}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
}

const TABS = [
  { id: 'api', label: 'API Keys', icon: Icon.key },
  { id: 'usage', label: 'Usage', icon: Icon.chart },
  { id: 'models', label: 'Models', icon: Icon.sliders },
  { id: 'general', label: 'General', icon: Icon.gear },
]

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-[18px] border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_30px_-24px_rgba(0,0,0,0.3)] ${className}`}
    >
      {children}
    </div>
  )
}

function Chip({ active, onClick, children, small = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border font-semibold transition-all duration-200 ${
        small ? 'px-[22px] py-[11px] text-[14.5px]' : 'px-[26px] py-3 text-[15px]'
      }`}
      style={
        active
          ? { background: 'var(--ink)', color: 'var(--inktext)', borderColor: 'var(--ink)' }
          : { background: 'transparent', color: 'var(--chiptext)', borderColor: 'var(--chipborder)' }
      }
    >
      {children}
    </button>
  )
}

function Toggle({ on, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="w-12 shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-[250ms]"
      style={{ background: on ? 'var(--ink)' : 'var(--track)' }}
    >
      <span
        className="block h-[22px] w-[22px] rounded-full bg-[var(--card)] shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-[250ms]"
        style={{ transform: `translateX(${on ? 20 : 0}px)` }}
      />
    </button>
  )
}

function SettingRow({ title, body, control, divider = true }) {
  return (
    <>
      {divider && <div className="my-6 h-px bg-[var(--divider)]" />}
      <div className="flex items-center justify-between gap-5">
        <div>
          <div className="text-[15px] font-semibold">{title}</div>
          <div className="mt-[3px] text-[13.5px] text-[var(--faint)]">{body}</div>
        </div>
        {control}
      </div>
    </>
  )
}

function PanelHeading({ title, children }) {
  return (
    <>
      <h1 className="m-0 mb-2 text-[30px] font-bold tracking-[-0.02em]">{title}</h1>
      <p className="m-0 mb-7 max-w-[560px] text-[15.5px] leading-[1.55] text-[var(--muted)]">
        {children}
      </p>
    </>
  )
}

function Settings() {
  const stored = useRef(loadStored()).current
  const [tab, setTab] = useState('api')
  const [keys, setKeys] = useState({ claude: '', gpt4o: '', gemini: '', ...stored.keys })
  const [show, setShow] = useState({ claude: false, gpt4o: false, gemini: false })
  const [saved, setSaved] = useState(false)
  const [defaultModel, setDefaultModel] = useState(stored.defaultModel ?? 'claude')
  const [compare, setCompare] = useState(stored.compare ?? false)
  const [theme, setTheme] = useState(stored.theme ?? 'light')
  const [saveHistory, setSaveHistory] = useState(stored.saveHistory ?? true)
  const savedTimer = useRef(null)

  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Everything except keys persists as it changes; keys persist on Save.
  useEffect(() => {
    const prev = loadStored()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...prev, defaultModel, compare, theme, saveHistory }),
    )
  }, [defaultModel, compare, theme, saveHistory])

  useEffect(() => () => clearTimeout(savedTimer.current), [])

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadStored(), keys }))
    setSaved(true)
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="settings-scope min-h-svh" data-theme={dark ? 'dark' : 'light'}>
      {/* top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bgt)] px-5 py-4 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-5">
          <span className="text-xl font-bold tracking-[-0.01em]">
            lumi
            <span className="ml-[3px] inline-block h-1.5 w-1.5 rounded-full bg-[var(--ink)] align-middle" />
          </span>
          <span className="text-[var(--subtle)]">/</span>
          <span className="text-[15px] text-[var(--muted)]">Settings</span>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--hoverbg)] hover:text-[var(--text)]"
        >
          ← Back to reading
        </Link>
      </div>

      <div className="mx-auto grid max-w-[1080px] items-start gap-8 px-5 pt-8 pb-20 sm:px-8 md:grid-cols-[216px_1fr] md:gap-11 md:pt-11">
        {/* sidebar */}
        <nav className="flex min-w-0 flex-col gap-1 md:sticky md:top-24">
          <div className="px-3.5 pb-3 text-xs font-semibold tracking-[0.08em] text-[var(--subtle)] uppercase">
            Settings
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {TABS.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="flex shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3.5 py-[11px] text-[15px] font-medium transition-colors duration-200"
                  style={{
                    color: active ? 'var(--text)' : 'var(--faint)',
                    background: active ? 'var(--hoverbg)' : 'transparent',
                  }}
                >
                  <span className="inline-flex h-[18px] w-[18px]">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-5 hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-4 md:block">
            <div className="mb-1.5 text-[13px] font-semibold">Keys stay on-device</div>
            <div className="text-[12.5px] leading-normal text-[var(--faint)]">
              Your API keys are stored locally in your browser and sent only to each provider.
            </div>
          </div>
        </nav>

        {/* content */}
        <main className="min-w-0">
          {tab === 'api' && (
            <div>
              <PanelHeading title="API Keys">
                Connect your own model providers. Lumi uses these keys to define words and
                answer your follow-up questions — pick a default under{' '}
                <span className="font-medium text-[var(--text)]">Models</span>.
              </PanelHeading>

              <div className="flex flex-col gap-3.5">
                {PROVIDERS.map((p) => {
                  const has = keys[p.id].trim().length > 0
                  const shown = show[p.id]
                  return (
                    <Card key={p.id} className="px-6 py-[22px]">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ink)] text-[17px] font-bold text-[var(--inktext)]">
                            {p.mono}
                          </div>
                          <div>
                            <div className="text-[17px] font-semibold tracking-[-0.01em]">
                              {p.name}
                            </div>
                            <div className="text-[13px] text-[var(--faint)]">{p.vendor}</div>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2 text-[13px] font-medium"
                          style={{ color: has ? 'var(--text)' : 'var(--subtle)' }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background: has ? 'var(--ink)' : 'transparent',
                              border: `1.5px solid ${has ? 'var(--ink)' : 'var(--dotoff)'}`,
                            }}
                          />
                          {has ? 'Connected' : 'Not set'}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2.5 rounded-xl border bg-[var(--field)] pr-2 pl-3.5 transition-colors duration-200"
                        style={{ borderColor: has ? 'var(--ink)' : 'var(--border)' }}
                      >
                        <input
                          value={keys[p.id]}
                          onChange={(e) => {
                            setKeys((k) => ({ ...k, [p.id]: e.target.value }))
                            setSaved(false)
                          }}
                          type={shown ? 'text' : 'password'}
                          placeholder={p.placeholder}
                          aria-label={`${p.name} API key`}
                          className="flex-1 border-none bg-transparent py-[13px] font-mono text-sm tracking-[0.02em] text-[var(--text)] outline-none"
                        />
                        <button
                          type="button"
                          title="Show / hide"
                          onClick={() => setShow((s) => ({ ...s, [p.id]: !s[p.id] }))}
                          className="inline-flex cursor-pointer rounded-lg border-none bg-transparent p-2 text-[var(--faint)] transition-colors duration-200 hover:bg-[var(--hoverbg)] hover:text-[var(--text)]"
                        >
                          {shown ? Icon.eyeOff : Icon.eye}
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>

              <div className="mt-[26px] flex flex-wrap items-center justify-between gap-5">
                <span className="text-[13.5px] text-[var(--faint)]">
                  {saved ? 'Your keys are saved locally.' : 'Keys are stored only in this browser.'}
                </span>
                <button
                  type="button"
                  onClick={save}
                  className="cursor-pointer rounded-full border-none bg-[var(--ink)] px-[26px] py-[13px] text-[14.5px] font-semibold text-[var(--inktext)] transition-transform duration-200 hover:-translate-y-px"
                >
                  {saved ? 'Saved ✓' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {tab === 'usage' && (
            <div>
              <PanelHeading title="Usage">
                Tokens billed to your own API keys. Counts reset on the 1st of each month.
              </PanelHeading>

              <div className="mb-3.5 grid gap-3.5 sm:grid-cols-3">
                {[
                  { label: 'Tokens this month', value: '1.24M', note: '≈ $4.87 across providers' },
                  { label: 'Lookups', value: '3,482', note: 'words defined in July' },
                  { label: 'Follow-up questions', value: '1,027', note: 'avg. 356 tokens each' },
                ].map((s) => (
                  <Card key={s.label} className="px-6 py-[22px] shadow-none">
                    <div className="text-[13px] font-medium text-[var(--faint)]">{s.label}</div>
                    <div className="mt-2 text-[34px] font-bold tracking-[-0.02em]">{s.value}</div>
                    <div className="mt-1 text-[12.5px] text-[var(--subtle)]">{s.note}</div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 shadow-none">
                <div className="mb-5 flex items-baseline justify-between">
                  <div className="text-[15px] font-semibold">By model</div>
                  <div className="font-mono text-[12.5px] text-[var(--subtle)]">
                    input / output
                  </div>
                </div>
                <div className="flex flex-col gap-[18px]">
                  {USAGE.map((u) => {
                    const maxTok = Math.max(...USAGE.map((x) => x.inTok + x.outTok))
                    return (
                      <div key={u.name}>
                        <div className="mb-2 flex items-baseline justify-between">
                          <span className="text-[14.5px] font-semibold">{u.name}</span>
                          <span className="font-mono text-[13px] text-[var(--faint)]">
                            {u.inTok + u.outTok}K tokens
                            <span className="text-[var(--subtle)]">
                              {' '}
                              · {u.inTok}K / {u.outTok}K
                            </span>
                          </span>
                        </div>
                        <div className="flex h-2.5 overflow-hidden rounded-full border border-[var(--divider)] bg-[var(--field)]">
                          <div
                            className="bg-[var(--ink)] transition-[width] duration-800"
                            style={{ width: `${((u.inTok / maxTok) * 100).toFixed(1)}%` }}
                          />
                          <div
                            className="bg-[var(--ink)] opacity-35 transition-[width] duration-800"
                            style={{ width: `${((u.outTok / maxTok) * 100).toFixed(1)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-[18px] flex gap-[18px] text-[12.5px] text-[var(--subtle)]">
                  <span className="inline-flex items-center gap-[7px]">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[var(--ink)]" />
                    input tokens
                  </span>
                  <span className="inline-flex items-center gap-[7px]">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[var(--ink)] opacity-35" />
                    output tokens
                  </span>
                </div>
              </Card>
            </div>
          )}

          {tab === 'models' && (
            <div>
              <PanelHeading title="Models">
                Choose which model answers by default. You can still switch per-lookup from
                the definition card.
              </PanelHeading>

              <Card className="p-6">
                <div className="mb-4 text-[15px] font-semibold">Default model</div>
                <div className="flex flex-wrap gap-2.5">
                  {PROVIDERS.map((p) => (
                    <Chip
                      key={p.id}
                      active={defaultModel === p.id}
                      onClick={() => setDefaultModel(p.id)}
                    >
                      {p.name}
                    </Chip>
                  ))}
                </div>
                <SettingRow
                  title="Compare all three"
                  body="Query every connected model at once and show answers side by side."
                  control={
                    <Toggle
                      on={compare}
                      onClick={() => setCompare((v) => !v)}
                      label="Compare all three"
                    />
                  }
                />
              </Card>
            </div>
          )}

          {tab === 'general' && (
            <div>
              <PanelHeading title="General">Appearance and your lookup history.</PanelHeading>

              <Card className="p-6">
                <div className="mb-3.5 text-[15px] font-semibold">Appearance</div>
                <div className="flex flex-wrap gap-2.5">
                  {['light', 'dark', 'system'].map((t) => (
                    <Chip key={t} small active={theme === t} onClick={() => setTheme(t)}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </Chip>
                  ))}
                </div>
                <SettingRow
                  title="Save lookup history"
                  body="Keep a searchable record of every word and prompt."
                  control={
                    <Toggle
                      on={saveHistory}
                      onClick={() => setSaveHistory((v) => !v)}
                      label="Save lookup history"
                    />
                  }
                />
                <SettingRow
                  title="Clear history"
                  body="Permanently delete all saved words and prompts."
                  control={
                    <button
                      type="button"
                      className="cursor-pointer rounded-full border border-[var(--chipborder)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--inktext)]"
                    >
                      Clear
                    </button>
                  }
                />
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Settings
