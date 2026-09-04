import { formatDays, formatNumber, formatPercent } from '../../lib/format.js'

/**
 * One dot per delivery — a unit chart, so "3 of 6 ran late" is countable
 * rather than inferred from a bar's length. Branch delivery counts here run
 * from 6 to 47, which is exactly the range where individual marks beat an
 * aggregate.
 *
 * Yellow is late and aqua is on time, the same two hues this product uses for
 * those states everywhere else. Each is named with its count in the legend, so
 * the colour is never the only thing saying which is which — and since both sit
 * under the 3:1 mark floor, that legend is required relief, not a nicety.
 */
export default function DeliveryDots({ stats }) {
  const onTime = stats.count - stats.delayedCount

  return (
    // Centred rather than anchored: a branch with six deliveries has little to
    // show, and when the card stretches to its neighbour the leftover height
    // reads as deliberate air only if it falls evenly above and below.
    <div className="flex grow flex-col justify-center">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <Legend
          dot="bg-warning"
          tone="text-warning-ink"
          label={`${formatNumber(stats.delayedCount)} delayed`}
        />
        <Legend
          dot="bg-good"
          tone="text-good-ink"
          label={`${formatNumber(onTime)} on time`}
        />
      </div>

      <ul
        className="mt-3 flex flex-wrap gap-1"
        role="img"
        aria-label={`${stats.delayedCount} of ${stats.count} deliveries were delayed`}
      >
        {Array.from({ length: stats.count }, (_, i) => (
          // Delayed first, so the run of late deliveries reads as a block.
          <li
            key={i}
            className={`size-3 rounded-[3px] ${
              i < stats.delayedCount ? 'bg-warning' : 'bg-good'
            }`}
          />
        ))}
      </ul>

      <p className="mt-3 text-sm text-ink-2">
        <span className="font-semibold text-warning-ink">
          {formatPercent(stats.delayedRate)}
        </span>{' '}
        missed their promised date, averaging {formatDays(stats.avgDays, 1)} to hand over.
      </p>

      {stats.reasons.length > 0 && (
        <div className="mt-3 border-t border-hairline pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-3">
            Delay causes
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {stats.reasons.map((reason) => (
              <li
                key={reason.reason}
                className="rounded-full border border-hairline bg-plane px-2.5 py-1 text-xs text-ink-2"
              >
                {reason.reason}
                <span className="tnum ml-1.5 font-semibold text-ink">{reason.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** The swatch wears the mark colour; the words wear the readable ink step. */
function Legend({ dot, tone, label }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${tone}`}>
      <span aria-hidden="true" className={`size-2.5 rounded-[3px] ${dot}`} />
      {label}
    </span>
  )
}
