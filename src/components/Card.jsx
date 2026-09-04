import { useId, useState } from 'react'

/**
 * Panel shell — one border, one title treatment, used by every block.
 *
 * With `collapsible`, the header becomes a disclosure button. The count stays
 * in the header so a collapsed panel still says how much is inside.
 */
export default function Card({
  id,
  icon,
  title,
  subtitle,
  action,
  children,
  className = '',
  titleClassName = 'text-ink',
  collapsible = false,
  defaultOpen = true,
  badge,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  const heading = (
    <div className="min-w-0 text-left">
      <h2 className={`flex items-center gap-2 text-base font-semibold tracking-tight ${titleClassName}`}>
        {icon}
        {title}
        {badge != null && (
          <span className="tnum rounded-full bg-critical/12 px-2 py-0.5 text-xs font-semibold text-critical-ink">
            {badge}
          </span>
        )}
      </h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
    </div>
  )

  return (
    <section
      id={id}
      className={`flex flex-col rounded-xl border border-hairline bg-surface ${className}`}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex w-full items-start justify-between gap-4 border-b border-hairline px-4 py-3 text-left hover:bg-plane sm:px-5"
        >
          {heading}
          <svg
            viewBox="0 0 20 20"
            className={`mt-0.5 size-4 shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        (title || action) && (
          <header className="flex items-start justify-between gap-4 border-b border-hairline px-4 py-3 sm:px-5">
            {heading}
            {action}
          </header>
        )
      )}

      {/* A column that grows: side-by-side cards stretch to the tallest in
          their row, and a child marked `grow` takes up the slack rather than
          leaving a pocket of blank surface under it. */}
      <div
        id={bodyId}
        hidden={collapsible && !open}
        className="flex grow flex-col p-4 sm:p-5"
      >
        {children}
      </div>
    </section>
  )
}
