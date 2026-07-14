import { useState } from 'react'
import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#how', label: 'How it works' },
  { to: '/#history', label: 'History' },
  { to: '/#faq', label: 'FAQ' },
]

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-[90] border-b border-black bg-bone/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-4 sm:px-10">
        <Link
          to="/"
          className="font-display text-2xl tracking-tight"
          onClick={() => setOpen(false)}
        >
          LUMI
          <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-black align-middle" />
        </Link>

        <nav
          aria-label="Main"
          className="hidden gap-8 font-mono text-xs tracking-[0.12em] uppercase md:flex"
        >
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="border-b border-transparent transition-colors duration-200 hover:border-black"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Yi-99/lumi"
            target="_blank"
            rel="noreferrer"
            className="hidden bg-black px-5 py-2.5 font-mono text-xs tracking-[0.1em] text-white uppercase transition-transform duration-200 hover:-translate-y-0.5 sm:inline-block"
          >
            Open app →
          </a>
          <button
            type="button"
            className="border border-black p-2 md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="square" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="square" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="Mobile"
          className="flex flex-col border-t border-black font-mono text-xs tracking-[0.12em] uppercase md:hidden"
        >
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="border-b border-black/20 px-5 py-3.5 transition-colors hover:bg-black hover:text-white"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/Yi-99/lumi"
            target="_blank"
            rel="noreferrer"
            className="bg-black px-5 py-3.5 text-white"
          >
            Open app →
          </a>
        </nav>
      )}
    </header>
  )
}

export default Navbar
