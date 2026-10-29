import type {
  HistoricalDataRequest,
} from '../../src/lib/historicalDataRequest'

import type {
  HistoricalDataResponse,
} from '../../src/lib/historicalDataResponse'

// Provider implementations must return the normalized
// Atlas contract rather than provider-specific JSON.
export interface HistoricalMarketDataProvider {
  readonly name: string

  fetchDailyBars(
    request: HistoricalDataRequest,
    signal: AbortSignal
  ): Promise<HistoricalDataResponse>
}

export type MarketDataProviderErrorCode =
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_RATE_LIMIT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'INVALID_UPSTREAM_DATA'

export class MarketDataProviderError extends Error {
  readonly code: MarketDataProviderErrorCode

  constructor(
    message: string,
    code: MarketDataProviderErrorCode
  ) {
    super(message)
    this.name = 'MarketDataProviderError'
    this.code = code
  }
}
