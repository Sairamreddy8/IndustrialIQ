export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} />
}

/** Loading placeholders that hold the real layout, so nothing jumps on load. */
export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-7 w-32" />
      <SkeletonBlock className="mt-2.5 h-3 w-20" />
    </div>
  )
}

// Uneven widths read as content arriving, rather than as a grey slab.
const ROW_WIDTHS = ['w-full', 'w-11/12', 'w-10/12', 'w-11/12', 'w-9/12', 'w-10/12']

export function PanelSkeleton({ rows = 6, className = '' }) {
  return (
    <div className={`rounded-xl border border-hairline bg-surface ${className}`}>
      <div className="border-b border-hairline px-4 py-3 sm:px-5">
        <SkeletonBlock className="h-3.5 w-40" />
        <SkeletonBlock className="mt-2 h-3 w-56" />
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonBlock key={i} className={`h-6 ${ROW_WIDTHS[i % ROW_WIDTHS.length]}`} />
        ))}
      </div>
    </div>
  )
}
