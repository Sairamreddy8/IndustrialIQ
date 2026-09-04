import { MARK } from './shades.js'
import { STAGE_LABELS } from '../../lib/constants.js'
import { formatNumber, formatPercent } from '../../lib/format.js'

/**
 * The funnel is a labelled bar list rather than a plotted chart: bar length
 * carries the magnitude, and the interesting number — how many leads fall out
 * between two stages — belongs in the gap between the bars, where a chart
 * library would have no place to put it.
 *
 * `benchmark` is an optional funnel from a wider scope (a branch against the
 * network, say). When given, each step shows the comparison inline, so the
 * reader never has to hold a percentage in their head from another panel.
 */
export default function FunnelChart({ stages, benchmark, benchmarkLabel = 'network' }) {
  const top = stages[0]?.count || 1

  return (
    // gap-1 is the floor between stages; justify-between hands any height the
    // card gained from its taller neighbour back to those gaps, so the funnel
    // reaches the foot of the card instead of stopping short of it.
    <ol className="flex grow flex-col justify-between gap-1">
      {stages.map((stage, i) => {
        const width = Math.max((stage.count / top) * 100, 2)
        const isLast = i === stages.length - 1
        const next = stages[i + 1]
        const benchmarkStep = benchmark?.[i + 1]?.stepConversion
        // Only worth calling out when the gap is big enough to act on.
        const behind =
          benchmarkStep != null &&
          next?.stepConversion != null &&
          next.stepConversion < benchmarkStep - 5

        return (
          <li key={stage.stage}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="font-medium text-ink">{STAGE_LABELS[stage.stage]}</span>
              <span className="tnum shrink-0 text-ink-2">
                {formatNumber(stage.count)}
                <span className="ml-2 text-ink-3">{formatPercent(stage.shareOfTop)}</span>
              </span>
            </div>

            <div className="mt-1.5 h-7 w-full overflow-hidden rounded bg-plane">
              <div
                className="h-full rounded"
                style={{
                  width: `${width}%`,
                  // Blue is volume all the way down, and the last bar turns
                  // aqua because that is what a delivered lead is coloured
                  // everywhere else on the page — the funnel's payoff, in the
                  // hue the reader has already learned.
                  background: stage.stage === 'delivered' ? MARK.good : MARK.volume,
                }}
                role="img"
                aria-label={`${formatNumber(stage.count)} leads reached ${STAGE_LABELS[stage.stage]}`}
              />
            </div>

            {!isLast && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5 pl-1 text-[11px] text-ink-3">
                <span aria-hidden="true">↓</span>
                <span className={`tnum ${behind ? 'font-medium text-critical-ink' : ''}`}>
                  {formatPercent(next.stepConversion)} continue
                </span>
                <span aria-hidden="true">·</span>
                <span className="tnum">{formatNumber(next.dropOff)} drop off</span>
                {benchmarkStep != null && (
                  <span className="tnum text-ink-3">
                    (vs {formatPercent(benchmarkStep)} {benchmarkLabel})
                  </span>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
