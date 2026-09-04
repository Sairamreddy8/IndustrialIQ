import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { BAR_SHADES } from './shades.js'
import { SOURCE_LABELS } from '../../lib/constants.js'
import { formatINR, formatNumber, formatPercent } from '../../lib/format.js'

/** Conversion rate by lead source, sorted strongest first. */
export default function SourceChart({ data }) {
  return (
    <div className="h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--color-hairline)" horizontal={false} />
          <XAxis
            type="number"
            unit="%"
            tickLine={false}
            axisLine={{ stroke: 'var(--color-baseline)' }}
            tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="source"
            tickFormatter={(s) => SOURCE_LABELS[s] ?? s}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-ink-2)', fontSize: 11 }}
            width={118}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-series-soft)', fillOpacity: 0.35 }}
            content={<SourceTooltip />}
          />
          <Bar
            dataKey="conversionRate"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            {data.map((row, i) => (
              <Cell key={row.source} fill={BAR_SHADES[i % BAR_SHADES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SourceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <ChartTooltip
      title={SOURCE_LABELS[row.source] ?? row.source}
      rows={[
        { label: 'Conversion', value: formatPercent(row.conversionRate, 1), color: payload[0].color },
        { label: 'Leads', value: formatNumber(row.leads) },
        { label: 'Delivered', value: formatNumber(row.delivered) },
        { label: 'Revenue', value: formatINR(row.revenue) },
      ]}
    />
  )
}
