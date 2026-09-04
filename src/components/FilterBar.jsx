import { buildPresets } from '../lib/ranges.js'
import { formatMonth } from '../lib/format.js'

/**
 * Time-range selection, mounted in the navbar. Presets cover the common
 * questions; the custom month span handles the rest. Every preset is measured
 * back from the dataset's as-of date, so "last 30 days" lands inside the data
 * rather than on today.
 *
 * Renders without surface chrome — the header supplies that.
 */
export default function FilterBar({ dataset, selection, onChange }) {
  const presets = buildPresets(dataset)
  const isCustom = selection.key === 'custom'
  const months = dataset.months

  return (
    <div
      role="group"
      aria-label="Time range"
      // Column layout so revealing the custom months grows the bar downwards
      // rather than shoving the preset buttons sideways under the cursor.
      className="flex flex-col items-center gap-2"
    >
      <div className="flex flex-wrap items-center justify-center gap-1">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange({ key: preset.key })}
            aria-pressed={selection.key === preset.key}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              selection.key === preset.key
                ? 'bg-series text-white'
                : 'text-ink-2 hover:bg-plane hover:text-ink'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({ key: 'custom', from: months[0], to: months[months.length - 1] })
          }
          aria-pressed={isCustom}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            isCustom ? 'bg-series text-white' : 'text-ink-2 hover:bg-plane hover:text-ink'
          }`}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MonthSelect
            label="From"
            months={months}
            value={selection.from}
            onChange={(from) => onChange({ ...selection, from })}
          />
          <span aria-hidden="true" className="text-xs text-ink-3">
            to
          </span>
          <MonthSelect
            label="To"
            months={months}
            value={selection.to}
            onChange={(to) => onChange({ ...selection, to })}
          />
        </div>
      )}

    </div>
  )
}

function MonthSelect({ label, months, value, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-ink-3">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-xs font-medium text-ink"
      >
        {months.map((month) => (
          <option key={month} value={month}>
            {formatMonth(month)}
          </option>
        ))}
      </select>
    </label>
  )
}
