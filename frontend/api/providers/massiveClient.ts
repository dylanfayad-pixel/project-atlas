import type {
  HistoricalDataRequest,
} from '../../src/lib/historicalDataRequest'
import type {
  HistoricalDataResponse,
} from '../../src/lib/historicalDataResponse'
import {
  normalizeMassiveResponse,
} from './massive'
import {
  MarketDataProviderError,
} from './types'
import type {
  HistoricalMarketDataProvider,
} from './types'

const MASSIVE_BASE_URL = 'https://api.massive.com'
const MAX_RESPONSE_BYTES = 2_000_000

// Construct the provider URL from validated Atlas inputs.
// Credentials are sent in an HTTP header, never the URL.
export function buildMassiveUrl(
  request: HistoricalDataRequest
): string {
  const symbol = encodeURIComponent(request.symbol)

  const url = new URL(
    `/v2/aggs/ticker/${symbol}/range/1/day/` +
    `${request.startDate}/${request.endDate}`,
    MASSIVE_BASE_URL
  )

  url.searchParams.set('adjusted', 'false')
  url.searchParams.set('sort', 'asc')
  url.searchParams.set('limit', '50000')

  return url.toString()
}

// A bounded reader avoids buffering arbitrarily large
// upstream responses into serverless memory.
async function readLimitedBody(
  response: Response
): Promise<string> {
  const reader = response.body?.getReader()

  if (!reader) {
    throw new MarketDataProviderError(
      'Provider returned an empty response body.',
      'INVALID_UPSTREAM_DATA'
    )
  }

  const decoder = new TextDecoder()
  let bytes = 0
  let output = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      bytes += value.byteLength

      if (bytes > MAX_RESPONSE_BYTES) {
        throw new MarketDataProviderError(
          'Provider response exceeds size limit.',
          'INVALID_UPSTREAM_DATA'
        )
      }

      output += decoder.decode(value, { stream: true })
    }

    output += decoder.decode()
    return output
  } finally {
    reader.releaseLock()
  }
}

export class MassiveHistoricalProvider
  implements HistoricalMarketDataProvider {
  readonly name = 'massive'

  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async fetchDailyBars(
    request: HistoricalDataRequest,
    signal: AbortSignal
  ): Promise<HistoricalDataResponse> {
    const response = await fetch(buildMassiveUrl(request), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      signal,
    })

    if (response.status === 429) {
      throw new MarketDataProviderError(
        'Market-data provider rate limit exceeded.',
        'UPSTREAM_RATE_LIMIT'
      )
    }

    if (!response.ok) {
      throw new MarketDataProviderError(
        'Market-data provider request failed.',
        'UPSTREAM_UNAVAILABLE'
      )
    }

    let json: unknown

    try {
      const body = await readLimitedBody(response)
      json = JSON.parse(body)
    } catch (cause: unknown) {
      if (cause instanceof MarketDataProviderError) {
        throw cause
      }

      throw new MarketDataProviderError(
        'Invalid market-data provider response.',
        'INVALID_UPSTREAM_DATA'
      )
    }

    return normalizeMassiveResponse(
      json,
      request,
      false,
      new Date().toISOString()
    )
  }
}
