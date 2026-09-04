import { BAR_SHADES } from './shades.js'
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
    <ol className="space-y-1">
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
                  background: BAR_SHADES[i % BAR_SHADES.length],
                }}
                role="img"
                aria-label={`${formatNumber(stage.count)} leads reached ${STAGE_LABELS[stage.stage]}`}
              />
            </div>

            {!isLast && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5 pl-1 text-[11px] text-ink-3">
                <span aria-hidden="true">↓</span>
                <span className={`tnum ${behind ? 'font-medium text-critical' : ''}`}>
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
