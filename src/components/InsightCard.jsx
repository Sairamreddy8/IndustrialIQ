/**
 * One actionable finding: what is wrong, the numbers behind it, and the thing
 * to do about it.
 *
 * Severity uses the reserved state hues, always beside a written label, so the
 * colour never carries the meaning on its own. The dot wears the mark step and
 * the words the darker ink step, because a 3.9:1 red is legible as a shape and
 * not as 12px type.
 */
const SEVERITY = {
  critical: { label: 'Act now', dot: 'bg-critical', text: 'text-critical-ink' },
  warning: { label: 'Watch', dot: 'bg-warning', text: 'text-warning-ink' },
  info: { label: 'Note', dot: 'bg-ink-3', text: 'text-ink-2' },
}

export default function InsightCard({ insight, link }) {
  const tone = SEVERITY[insight.severity] ?? SEVERITY.info

  // scrollIntoView rather than an href, so following the link does not push a
  // hash onto the URL or fight the modal's own scroll container.
  const jump = () => {
    document.getElementById(link.targetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4 sm:flex-row sm:items-start sm:gap-5">
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${tone.text}`}>
          <span aria-hidden="true" className={`size-2 rounded-full ${tone.dot}`} />
          {tone.label}
        </p>
        <h3 className="mt-1.5 text-sm font-semibold text-ink">{insight.title}</h3>
        <p className="mt-1 text-sm text-ink-2">{insight.body}</p>
        <p className="mt-2 text-sm font-medium text-ink">
          <span className="text-ink-3">Do this: </span>
          {insight.action}
        </p>

        {link && (
          <button
            type="button"
            onClick={jump}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-series hover:underline"
          >
            {link.label}
            <svg
              viewBox="0 0 20 20"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M7.5 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="shrink-0 border-hairline sm:w-40 sm:border-l sm:pl-5 sm:text-right">
        <p className="text-lg font-semibold tracking-tight text-ink">{insight.metric}</p>
        <p className="text-xs text-ink-3">{insight.metricLabel}</p>
      </div>
    </article>
  )
}
