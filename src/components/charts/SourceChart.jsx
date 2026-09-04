import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip.jsx'
import { MARK } from './shades.js'
import { SOURCE_LABELS } from '../../lib/constants.js'
import { formatINR, formatNumber, formatPercent } from '../../lib/format.js'

/**
 * Conversion rate by lead source, sorted strongest first.
 *
 * Aqua because that is this product's colour for a lead that went well, and one
 * hue throughout because the sources are one series — colouring six nominal
 * bars six ways would spend the identity channel restating the labels already
 * down the axis.
 *
 * Aqua is 2.8:1 on white, under the 3:1 mark floor, so the rate is printed at
 * the end of every bar. That label is the relief the contrast rule requires,
 * not decoration: it is what lets the values be read without the fill.
 */
export default function SourceChart({ data }) {
  return (
    // Grows into whatever height the row settles at; the h-64 is the floor.
    <div className="h-64 grow sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 44, bottom: 0, left: 0 }}
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
            fill={MARK.good}
            radius={[0, 4, 4, 0]}
            maxBarSize={26}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="conversionRate"
              position="right"
              offset={8}
              formatter={(v) => formatPercent(v)}
              className="tnum"
              fill="var(--color-ink-2)"
              fontSize={11}
            />
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
        { label: 'Conversion', value: formatPercent(row.conversionRate, 1), color: MARK.good },
        { label: 'Leads', value: formatNumber(row.leads) },
        { label: 'Delivered', value: formatNumber(row.delivered) },
        { label: 'Revenue', value: formatINR(row.revenue) },
      ]}
    />
  )
}
