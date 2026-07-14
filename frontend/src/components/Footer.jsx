import { Link } from 'react-router-dom'
import LumiStar from './LumiStar.jsx'

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <LumiStar className="h-5 w-5" />
          <span className="font-display font-bold text-fog">lumi</span>
          <span className="text-sm text-mist">— Lookup for LLMs · MIT License</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-mist">
          <a
            href="https://github.com/Yi-99/lumi"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-fog"
          >
            GitHub
          </a>
          <Link to="/privacy" className="transition-colors hover:text-fog">
            Privacy Policy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-fog">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
