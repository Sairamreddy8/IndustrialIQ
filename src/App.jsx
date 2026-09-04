import { useMemo, useState } from 'react'
import Overview from './pages/Overview.jsx'
import FilterBar from './components/FilterBar.jsx'
import { useDataset } from './context/useDataset.js'
import { resolveRange } from './lib/ranges.js'
import { formatDate } from './lib/format.js'

export default function App() {
  const { status, dataset } = useDataset()

  // The range lives here because the navbar owns the control and the page
  // owns the panels that read it.
  const [selection, setSelection] = useState({ key: 'full' })
  const resolved = useMemo(
    () => (dataset ? resolveRange(dataset, selection) : null),
    [dataset, selection],
  )

  return (
    <div className="min-h-dvh bg-plane">
      <header className="sticky top-0 z-10 border-b border-hairline bg-surface">
        {/* Three tracks so the range control sits centred in the bar, with the
            title and the as-of stamp balanced either side of it. Below lg it
            stacks and the filter centres on its own row. */}
        <div className="mx-auto grid max-w-[90rem] items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
          <div className="text-center lg:text-left">
            <h1 className="text-lg font-semibold tracking-tight text-ink">DealerPulse</h1>
            <p className="text-xs text-ink-3">Dealership network performance</p>
          </div>

          {status === 'ready' && (
            <>
              <FilterBar
                dataset={dataset}
                selection={selection}
                onChange={setSelection}
              />
              <p className="text-center text-xs text-ink-2 lg:text-right">
                Data as of{' '}
                <span className="font-medium text-ink">{formatDate(dataset.asOf)}</span>
              </p>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[90rem] px-4 py-5 sm:px-6 sm:py-6">
        <Overview range={resolved?.range} rangeLabel={resolved?.label} />
      </main>
    </div>
  )
}
