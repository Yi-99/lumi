import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import LumiStar from './LumiStar.jsx'

const LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#install', label: 'Install' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
]

function GitHubIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `rounded-full px-3 py-1.5 text-sm transition-colors ${
      isActive ? 'text-glow' : 'text-mist hover:text-fog'
    }`

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Main"
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-night-900/75 shadow-lg shadow-night-950/50 backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-2">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <LumiStar className="h-6 w-6" />
            <span className="font-display text-lg font-bold tracking-tight text-fog">lumi</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ to, label }) =>
              to.includes('#') ? (
                <Link key={to} to={to} className="rounded-full px-3 py-1.5 text-sm text-mist transition-colors hover:text-fog">
                  {label}
                </Link>
              ) : (
                <NavLink key={to} to={to} className={linkClass}>
                  {label}
                </NavLink>
              ),
            )}
            <a
              href="https://github.com/Yi-99/lumi"
              target="_blank"
              rel="noreferrer"
              className="ml-1 flex items-center gap-1.5 rounded-full bg-fog px-3 py-1.5 text-sm font-medium text-night-900 transition-opacity hover:opacity-85"
            >
              <GitHubIcon className="h-4 w-4" />
              GitHub
            </a>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-mist hover:text-fog md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
            {LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-2 py-2 text-sm text-mist hover:bg-white/5 hover:text-fog"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <a
              href="https://github.com/Yi-99/lumi"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-mist hover:bg-white/5 hover:text-fog"
            >
              <GitHubIcon className="h-4 w-4" />
              GitHub
            </a>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
