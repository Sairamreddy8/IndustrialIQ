import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { formatINR, formatMonth, formatMonthShort, formatPercent, pct } from '../../lib/format.js'

const DELIVERED = 'var(--color-series)'
const SHORTFALL = 'var(--color-hairline)'

/**
 * Delivered revenue against target, by calendar month, as a deficit bar.
 *
 * Each bar spans the whole month's target: the filled base is what was
 * delivered and the remainder is what was missed, so attainment reads as how
 * far the blue climbs. Attainment in this dataset runs at ~11%, and plotting
 * the bars against a separate target line left them as slivers under a mostly
 * empty plot — stacking the shortfall on top uses that space to state the gap
 * instead of leaving it blank.
 *
 * Both segments are rupees on one axis, and the shortfall is a neutral rather
 * than a second hue: it is absence, not a competing category.
 */
export default function RevenueTargetChart({ data }) {
  const rows = data.map((month) => ({
    ...month,
    // Clamped so an over-performing month stacks nothing rather than inverting.
    shortfall: Math.max(month.targetRevenue - month.revenue, 0),
  }))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <Legend color={DELIVERED} label="Revenue delivered" />
        <Legend color={SHORTFALL} label="Shortfall to target" />
      </div>

      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-baseline)' }}
              tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
              dy={4}
            />
            <YAxis
              tickFormatter={(v) => formatINR(v)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
              width={62}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-series-soft)', fillOpacity: 0.3 }}
              content={<RevenueTooltip />}
            />
            <Bar
              dataKey="revenue"
              stackId="target"
              fill={DELIVERED}
              maxBarSize={44}
              isAnimationActive={false}
              // A hairline of the card surface keeps the two segments apart.
              stroke="var(--color-surface)"
              strokeWidth={1}
            />
            <Bar
              dataKey="shortfall"
              stackId="target"
              fill={SHORTFALL}
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
              isAnimationActive={false}
              stroke="var(--color-surface)"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Summary data={data} />
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-2 text-xs text-ink-2">
      <span
        aria-hidden="true"
        className="size-2.5 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  )
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const { revenue, targetRevenue, shortfall, units } = payload[0].payload
  return (
    <ChartTooltip
      title={formatMonth(label)}
      rows={[
        { label: 'Delivered', value: formatINR(revenue), color: DELIVERED },
        { label: 'Shortfall', value: formatINR(shortfall), color: SHORTFALL },
        { label: 'Target', value: formatINR(targetRevenue) },
        { label: 'Attainment', value: formatPercent(pct(revenue, targetRevenue), 1) },
        { label: 'Units delivered', value: units },
      ]}
    />
  )
}

/** Three facts the chart itself cannot state, along its foot. */
function Summary({ data }) {
  const withRevenue = data.filter((m) => m.revenue > 0)
  if (!withRevenue.length) return null

  const best = withRevenue.reduce((a, b) => (b.revenue > a.revenue ? b : a))
  const weakest = withRevenue.reduce((a, b) =>
    pct(b.revenue, b.targetRevenue) < pct(a.revenue, a.targetRevenue) ? b : a,
  )
  const revenue = data.reduce((sum, m) => sum + m.revenue, 0)
  const target = data.reduce((sum, m) => sum + m.targetRevenue, 0)

  return (
    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-hairline pt-3 sm:grid-cols-3">
      <Fact
        label="Strongest month"
        value={formatMonth(best.month)}
        detail={`${formatINR(best.revenue)} · ${formatPercent(pct(best.revenue, best.targetRevenue))} of target`}
      />
      <Fact
        label="Weakest month"
        value={formatMonth(weakest.month)}
        detail={`${formatINR(weakest.revenue)} · ${formatPercent(pct(weakest.revenue, weakest.targetRevenue))} of target`}
      />
      <Fact
        label="Gap to target"
        value={formatINR(target - revenue)}
        detail={`${formatINR(revenue)} of ${formatINR(target)} delivered`}
      />
    </dl>
  )
}

function Fact({ label, value, detail }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink">{value}</dd>
      <dd className="tnum text-xs text-ink-2">{detail}</dd>
    </div>
  )
}
