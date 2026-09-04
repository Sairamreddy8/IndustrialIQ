import { useContext } from 'react'
import { DataContext } from './DataContext.js'

/** Access the loaded dataset, plus its loading/error status and a retry. */
export function useDataset() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useDataset must be used inside a DataProvider')
  return context
}
