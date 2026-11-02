import type {
  HistoricalDataRequest,
} from '../../src/lib/historicalDataRequest'

import {
  validateHistoricalResponseForRequest,
} from '../../src/lib/historicalDataResponse'

import type {
  HistoricalDataResponse,
} from '../../src/lib/historicalDataResponse'

import {
  MarketDataProviderError,
} from './types'

import type {
  HistoricalMarketDataProvider,
} from './types'

export const PROVIDER_TIMEOUT_MS = 8000

// Bound how long the API waits for an upstream provider.
// Providers must also respect AbortSignal to stop work.
export async function executeProviderRequest(
  provider: HistoricalMarketDataProvider,
  request: HistoricalDataRequest
): Promise<HistoricalDataResponse> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new MarketDataProviderError(
        'Historical data provider timed out.',
        'UPSTREAM_TIMEOUT'
      ))
    }, PROVIDER_TIMEOUT_MS)
  })

  try {
    const response = await Promise.race([
      provider.fetchDailyBars(request, controller.signal),
      timeout,
    ])

    try {
      return validateHistoricalResponseForRequest(
        response,
        request
      )
    } catch {
      throw new MarketDataProviderError(
        'Provider returned invalid historical data.',
        'INVALID_UPSTREAM_DATA'
      )
    }
  } catch (cause: unknown) {
    if (cause instanceof MarketDataProviderError) {
      throw cause
    }

    if (controller.signal.aborted) {
      throw new MarketDataProviderError(
        'Historical data provider timed out.',
        'UPSTREAM_TIMEOUT'
      )
    }

    throw new MarketDataProviderError(
      'Historical data provider is unavailable.',
      'UPSTREAM_UNAVAILABLE'
    )
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
