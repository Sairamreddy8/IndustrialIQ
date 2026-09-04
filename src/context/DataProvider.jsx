import { useCallback, useEffect, useState } from 'react'
import { DataContext } from './DataContext.js'
import { loadDataset } from '../lib/data.js'

/** Fetches the dataset once and shares it with the tree. */
export function DataProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', dataset: null, error: null })
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setState({ status: 'loading', dataset: null, error: null })
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadDataset(controller.signal)
      .then((dataset) => setState({ status: 'ready', dataset, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({ status: 'error', dataset: null, error })
      })
    return () => controller.abort()
  }, [attempt])

  return <DataContext.Provider value={{ ...state, retry }}>{children}</DataContext.Provider>
}
