/** Shared tooltip shell so every chart's hover layer looks identical. */
export default function ChartTooltip({ title, rows }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-ink">{title}</p>
      <div className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-xs">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full"
              style={{ background: row.color ?? 'var(--color-baseline)' }}
            />
            <span className="text-ink-2">{row.label}</span>
            <span className="tnum ml-auto font-medium text-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
