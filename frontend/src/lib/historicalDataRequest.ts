// Validate historical market-data requests before they
// are submitted to a future server-side provider adapter.

import { validateSymbol } from './instrumentMetadata'

export type HistoricalDataRequest = {
  symbol: string
  startDate: string
  endDate: string
  timeframe: '1d'
}

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_RANGE_DAYS = 366 * 5

function parseCalendarDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Dates must use YYYY-MM-DD.')
  }

  const [year, month, day] = value.split('-').map(Number)
  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Invalid calendar date.')
  }

  return timestamp
}

export function createHistoricalDataRequest(
  symbolInput: string,
  startDate: string,
  endDate: string
): HistoricalDataRequest {
  const symbol = validateSymbol(symbolInput)

  const start = parseCalendarDate(startDate)
  const end = parseCalendarDate(endDate)

  if (end < start) {
    throw new Error(
      'End date must not precede start date.'
    )
  }

  if ((end - start) / DAY_MS > MAX_RANGE_DAYS) {
    throw new Error(
      'Historical range exceeds the five-year limit.'
    )
  }

  return {
    symbol,
    startDate,
    endDate,
    timeframe: '1d',
  }
}
