import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 px-5 py-10 font-mono text-xs tracking-[0.1em] uppercase sm:px-10">
      <span className="font-display text-lg normal-case tracking-tight">LUMI●</span>
      <span>AI dictionary · © 2026</span>
      <div className="flex gap-6">
        <Link to="/privacy" className="transition-opacity hover:opacity-50">
          Privacy
        </Link>
        <Link to="/terms" className="transition-opacity hover:opacity-50">
          Terms
        </Link>
        <a
          href="https://github.com/Yi-99/lumi/issues"
          target="_blank"
          rel="noreferrer"
          className="transition-opacity hover:opacity-50"
        >
          Contact
        </a>
      </div>
    </footer>
  )
}

export default Footer
