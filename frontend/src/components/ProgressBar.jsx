import { useEffect, useRef } from 'react'

// 4px reading-progress bar pinned above the topbar.
function ProgressBar() {
  const barRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      const pct = max > 0 ? h.scrollTop / max : 0
      if (barRef.current) barRef.current.style.width = `${pct * 100}%`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <div ref={barRef} className="fixed top-0 left-0 z-[100] h-1 w-0 bg-black" />
}

export default ProgressBar
