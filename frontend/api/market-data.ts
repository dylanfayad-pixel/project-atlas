import type { IncomingMessage, ServerResponse } from 'node:http'
import { createHistoricalDataRequest } from '../src/lib/historicalDataRequest'
import { executeProviderRequest } from './providers/execute'
import {
  MarketDataProviderError,
} from './providers/types'
import type {
  HistoricalMarketDataProvider,
} from './providers/types'

type ApiError = {
  error: string
  code: string
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown
) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

function mapProviderError(error: MarketDataProviderError): number {
  switch (error.code) {
    case 'UPSTREAM_TIMEOUT':
      return 504
    case 'UPSTREAM_RATE_LIMIT':
      return 429
    case 'INVALID_UPSTREAM_DATA':
      return 502
    case 'UPSTREAM_UNAVAILABLE':
      return 503
  }
}

// Dependency injection keeps provider behavior independently
// testable without network access or real credentials.
export function createMarketDataHandler(
  provider: HistoricalMarketDataProvider | null
) {
  return async function handler(
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> {
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET')
      sendJson(response, 405, {
        error: 'Only GET requests are supported.',
        code: 'METHOD_NOT_ALLOWED',
      })
      return
    }

    let historicalRequest

    try {
      const rawUrl = request.url ?? ''

      if (rawUrl.length > 2048) {
        throw new Error('Request URL too long.')
      }

      const url = new URL(rawUrl, 'http://localhost')

      const allowed = new Set([
        'symbol',
        'start',
        'end',
        'timeframe',
      ])

      for (const key of url.searchParams.keys()) {
        if (
          !allowed.has(key) ||
          url.searchParams.getAll(key).length !== 1
        ) {
          throw new Error('Invalid query parameters.')
        }
      }

      if (
        url.searchParams.has('timeframe') &&
        url.searchParams.get('timeframe') !== '1d'
      ) {
        throw new Error('Unsupported timeframe.')
      }

      historicalRequest = createHistoricalDataRequest(
        url.searchParams.get('symbol') ?? '',
        url.searchParams.get('start') ?? '',
        url.searchParams.get('end') ?? ''
      )
    } catch {
      sendJson(response, 400, {
        error: 'Invalid historical market-data request.',
        code: 'INVALID_REQUEST',
      } satisfies ApiError)
      return
    }

    if (!provider) {
      sendJson(response, 503, {
        error: 'Historical market-data provider is not configured.',
        code: 'PROVIDER_NOT_CONFIGURED',
      } satisfies ApiError)
      return
    }

    try {
      const result = await executeProviderRequest(
        provider,
        historicalRequest
      )

      sendJson(response, 200, result)
    } catch (cause: unknown) {
      if (cause instanceof MarketDataProviderError) {
        sendJson(response, mapProviderError(cause), {
          error: cause.message,
          code: cause.code,
        } satisfies ApiError)
        return
      }

      sendJson(response, 503, {
        error: 'Historical market-data service unavailable.',
        code: 'UPSTREAM_UNAVAILABLE',
      } satisfies ApiError)
    }
  }
}

// Production remains explicitly unconfigured until
// a licensed provider adapter is selected.
export default createMarketDataHandler(null)
