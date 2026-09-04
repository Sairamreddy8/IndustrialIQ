/** Shared empty / error panel so no block ever renders as a blank box. */
export default function StateMessage({ title, body, action, tone = 'neutral' }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <p
        className={`text-sm font-semibold ${
          tone === 'error' ? 'text-critical-ink' : 'text-ink'
        }`}
      >
        {title}
      </p>
      {body && <p className="mt-1.5 max-w-sm text-xs text-ink-2">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
