// The four-point star from the extension icon, reusable at any size.
function LumiStar({ className = '', style, glow = false }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
      {glow && (
        <circle cx="50" cy="50" r="30" fill="#f59e0b" opacity="0.35">
          <animate attributeName="opacity" values="0.25;0.45;0.25" dur="4s" repeatCount="indefinite" />
        </circle>
      )}
      <path
        d="M 50 8 Q 50 50 8 50 Q 50 50 50 92 Q 50 50 92 50 Q 50 50 50 8 Z"
        fill="url(#lumi-star-grad)"
      />
      <path
        d="M 50 24 Q 50 50 24 50 Q 50 50 50 76 Q 50 50 76 50 Q 50 50 50 24 Z"
        fill="#fffdf4"
      />
      <defs>
        <linearGradient id="lumi-star-grad" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default LumiStar
