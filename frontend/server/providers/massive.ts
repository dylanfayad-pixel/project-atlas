import type {
  HistoricalDataRequest,
} from '../../src/lib/historicalDataRequest'
import type {
  HistoricalDataResponse,
} from '../../src/lib/historicalDataResponse'
import {
  MarketDataProviderError,
} from './types'

type MassiveBar = {
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
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

// Normalize Massive aggregate bars into Atlas's
// provider-independent daily OHLCV response schema.
export function normalizeMassiveResponse(
  input: unknown,
  request: HistoricalDataRequest,
  adjusted: boolean,
  retrievedAt: string
): HistoricalDataResponse {
  if (!isRecord(input) || !Array.isArray(input.results)) {
    throw new MarketDataProviderError(
      'Invalid aggregate response.',
      'INVALID_UPSTREAM_DATA'
    )
  }

  if (
    typeof input.ticker !== 'string' ||
    input.ticker.toUpperCase() !== request.symbol
  ) {
    throw new MarketDataProviderError(
      'Aggregate ticker mismatch.',
      'INVALID_UPSTREAM_DATA'
    )
  }

  // Reject explicitly paginated responses until bounded
  // pagination is implemented. Incomplete datasets must
  // never silently enter quantitative research.
  if (
    typeof input.next_url === 'string' &&
    input.next_url.trim().length > 0
  ) {
    throw new MarketDataProviderError(
      'Historical aggregate response is incomplete.',
      'INVALID_UPSTREAM_DATA'
    )
  }

  const bars = input.results.map((value): MassiveBar => {
    if (!isRecord(value)) {
      throw new MarketDataProviderError(
        'Invalid aggregate observation.',
        'INVALID_UPSTREAM_DATA'
      )
    }

    const fields = [
      value.t,
      value.o,
      value.h,
      value.l,
      value.c,
      value.v,
    ]

    // Reject malformed epoch timestamps before
    // converting provider observations to dates.
    if (
      typeof value.t !== 'number' ||
      !Number.isSafeInteger(value.t) ||
      value.t < 0 ||
      !Number.isFinite(new Date(value.t).getTime())
    ) {
      throw new MarketDataProviderError(
        'Invalid aggregate timestamp.',
        'INVALID_UPSTREAM_DATA'
      )
    }

    if (
      fields.some(
        (field) =>
          typeof field !== 'number' ||
          !Number.isFinite(field)
      )
    ) {
      throw new MarketDataProviderError(
        'Invalid aggregate numeric field.',
        'INVALID_UPSTREAM_DATA'
      )
    }

    return value as MassiveBar
  })

  if (bars.length === 0) {
    throw new MarketDataProviderError(
      'No historical observations returned.',
      'INVALID_UPSTREAM_DATA'
    )
  }

  return {
    schema_version: 1,
    symbol: request.symbol,
    provider: 'massive',
    timeframe: '1d',
    start_date: request.startDate,
    end_date: request.endDate,
    adjusted,
    retrieved_at: retrievedAt,
    bars: bars.map((bar) => ({
      timestamp: new Date(bar.t)
        .toISOString()
        .slice(0, 10),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    })),
  }
}
