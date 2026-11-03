/** Flag-style SVG icons for currencies */

type Code = 'NGN' | 'USD' | 'GBP' | 'EUR' | string

export default function CurrencyIcon({ code, size = 18 }: { code: Code; size?: number }) {
  const w = size
  const h = Math.round(size * 0.72)

  if (code === 'NGN') {
    return (
      <svg width={w} height={h} viewBox="0 0 36 24" className="rounded-sm overflow-hidden shrink-0" aria-hidden>
        <rect width="12" height="24" fill="#008751" />
        <rect x="12" width="12" height="24" fill="#fff" />
        <rect x="24" width="12" height="24" fill="#008751" />
      </svg>
    )
  }
  if (code === 'USD') {
    return (
      <svg width={w} height={h} viewBox="0 0 36 24" className="rounded-sm overflow-hidden shrink-0" aria-hidden>
        <rect width="36" height="24" fill="#B22234" />
        <rect y="2.18" width="36" height="2.18" fill="#fff" />
        <rect y="6.55" width="36" height="2.18" fill="#fff" />
        <rect y="10.91" width="36" height="2.18" fill="#fff" />
        <rect y="15.27" width="36" height="2.18" fill="#fff" />
        <rect y="19.64" width="36" height="2.18" fill="#fff" />
        <rect width="14" height="12.5" fill="#3C3B6E" />
      </svg>
    )
  }
  if (code === 'GBP') {
    return (
      <svg width={w} height={h} viewBox="0 0 36 24" className="rounded-sm overflow-hidden shrink-0" aria-hidden>
        <rect width="36" height="24" fill="#012169" />
        <path d="M0 0L36 24M36 0L0 24" stroke="#fff" strokeWidth="4" />
        <path d="M0 0L36 24M36 0L0 24" stroke="#C8102E" strokeWidth="2" />
        <path d="M18 0V24M0 12H36" stroke="#fff" strokeWidth="7" />
        <path d="M18 0V24M0 12H36" stroke="#C8102E" strokeWidth="4" />
      </svg>
    )
  }
  if (code === 'EUR') {
    return (
      <svg width={w} height={h} viewBox="0 0 36 24" className="rounded-sm overflow-hidden shrink-0" aria-hidden>
        <rect width="36" height="24" fill="#003399" />
        <g fill="#FFCC00">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
            const a = ((i * 30 - 90) * Math.PI) / 180
            const cx = 18 + Math.cos(a) * 7
            const cy = 12 + Math.sin(a) * 7
            return <circle key={i} cx={cx} cy={cy} r="1.1" />
          })}
        </g>
      </svg>
    )
  }
  return (
    <svg width={w} height={h} viewBox="0 0 36 24" className="rounded-sm shrink-0" aria-hidden>
      <rect width="36" height="24" fill="#888" rx="2" />
    </svg>
  )
}
