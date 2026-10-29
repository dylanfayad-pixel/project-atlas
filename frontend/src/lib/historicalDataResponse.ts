import { parseOhlcvCsv } from './ohlcvData'
import type { OhlcvBar } from './ohlcvData'
import { createHistoricalDataRequest } from './historicalDataRequest'

export type HistoricalDataResponse = {
  schema_version: 1
  symbol: string
  provider: string
  timeframe: '1d'
  start_date: string
  end_date: string
  adjusted: boolean
  retrieved_at: string
  bars: OhlcvBar[]
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

// Convert unknown JSON into a validated research dataset.
// Never trust an external provider's response implicitly.
export function parseHistoricalDataResponse(
  input: unknown
): HistoricalDataResponse {
  if (!isRecord(input)) {
    throw new Error('Historical response must be an object.')
  }

  if (input.schema_version !== 1) {
    throw new Error('Unsupported historical response version.')
  }

  if (
    typeof input.symbol !== 'string' ||
    typeof input.provider !== 'string' ||
    !input.provider.trim() ||
    typeof input.start_date !== 'string' ||
    typeof input.end_date !== 'string'
  ) {
    throw new Error('Invalid historical response metadata.')
  }

  if (input.timeframe !== '1d') {
    throw new Error('Unsupported historical timeframe.')
  }

  if (typeof input.adjusted !== 'boolean') {
    throw new Error('Missing price adjustment metadata.')
  }

  if (
    typeof input.retrieved_at !== 'string' ||
    !Number.isFinite(Date.parse(input.retrieved_at))
  ) {
    throw new Error('Invalid retrieval timestamp.')
  }

  const request = createHistoricalDataRequest(
    input.symbol,
    input.start_date,
    input.end_date
  )

  if (!Array.isArray(input.bars) || input.bars.length === 0) {
    throw new Error('Historical response contains no observations.')
  }

  // Reuse the strict OHLCV validator for chronological,
  // numeric, calendar-date, and price relationship checks.
  const csv = [
    'timestamp,open,high,low,close,volume',
    ...input.bars.map((value) => {
      if (!isRecord(value)) {
        throw new Error('Invalid historical observation.')
      }

      return [
        value.timestamp,
        value.open,
        value.high,
        value.low,
        value.close,
        value.volume,
      ].join(',')
    }),
  ].join('\n')

  const bars = parseOhlcvCsv(csv)

  if (
    bars[0].timestamp < request.startDate ||
    bars[bars.length - 1].timestamp > request.endDate
  ) {
    throw new Error(
      'Historical observations fall outside the requested range.'
    )
  }

  return {
    schema_version: 1,
    symbol: request.symbol,
    provider: input.provider.trim(),
    timeframe: '1d',
    start_date: request.startDate,
    end_date: request.endDate,
    adjusted: input.adjusted,
    retrieved_at: input.retrieved_at,
    bars,
  }
}

// Ensure a provider response belongs to the exact
// research request that initiated the retrieval.
export function validateHistoricalResponseForRequest(
  input: unknown,
  expected: {
    symbol: string
    startDate: string
    endDate: string
    timeframe: '1d'
  }
): HistoricalDataResponse {
  const response = parseHistoricalDataResponse(input)

  const request = createHistoricalDataRequest(
    expected.symbol,
    expected.startDate,
    expected.endDate
  )

  if (
    response.symbol !== request.symbol ||
    response.start_date !== request.startDate ||
    response.end_date !== request.endDate ||
    response.timeframe !== request.timeframe
  ) {
    throw new Error(
      'Historical provider response does not match the requested instrument or period.'
    )
  }

  return response
}
