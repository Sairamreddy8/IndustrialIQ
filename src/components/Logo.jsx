/*
 * The product mark: a monitor trace on a blue tile. Blue is the volume hue, so
 * the brand sits in the same colour language as the charts rather than beside
 * it, and the trace is the name — a pulse read off the network.
 *
 * Kept as inline SVG rather than an <img> so it inherits the page's rendering
 * and stays crisp at any density. It carries no label: the <h1> beside it
 * already says DealerPulse, and a second announcement would only repeat it.
 * The same artwork ships standalone as public/favicon.svg.
 */
export default function Logo({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id="dp-logo-tile"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-series)" />
          <stop offset="1" stopColor="var(--color-series-deep)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7.5" fill="url(#dp-logo-tile)" />
      <path
        d="M6.5 18.5H11.9L15 10.1L18.4 22.3L21.4 16H25.5"
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
