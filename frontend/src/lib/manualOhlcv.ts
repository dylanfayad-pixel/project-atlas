import { parseOhlcvCsv } from './ohlcvData'
import type { OhlcvBar } from './ohlcvData'

// Keep input values as strings until validation so empty
// fields cannot silently become numeric zero.
export type ManualOhlcvRow = {
  timestamp: string
  open: string
  high: string
  low: string
  close: string
  volume: string
}

const HEADER = 'timestamp,open,high,low,close,volume'

// Create a blank editable observation.
export function createManualRow(): ManualOhlcvRow {
  return {
    timestamp: '',
    open: '',
    high: '',
    low: '',
    close: '',
    volume: '',
  }
}

// Reuse the strict CSV validator as the single source
// of truth for both uploaded and manually entered data.
export function validateManualOhlcv(
  rows: ManualOhlcvRow[]
): OhlcvBar[] {
  if (rows.length === 0) {
    throw new Error('Enter at least one market observation.')
  }

  const lines = rows.map((row) => [
    row.timestamp,
    row.open,
    row.high,
    row.low,
    row.close,
    row.volume,
  ].join(','))

  return parseOhlcvCsv([
    HEADER,
    ...lines,
  ].join('\n'))
}
