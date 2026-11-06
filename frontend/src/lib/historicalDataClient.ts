import {
  createHistoricalDataRequest,
} from './historicalDataRequest'
import {
  validateHistoricalResponseForRequest,
} from './historicalDataResponse'
import type {
  HistoricalDataResponse,
} from './historicalDataResponse'

// Public API errors contain stable codes and safe messages.
export class HistoricalDataClientError extends Error {
  readonly code: string
  readonly status: number

  constructor(
    message: string,
    code: string,
    status: number,
  ) {
    super(message)
    this.name = 'HistoricalDataClientError'
    this.code = code
    this.status = status
  }
}

type FetchFunction = typeof fetch

type LoadOptions = {
  signal?: AbortSignal
  fetchImpl?: FetchFunction
}

// Request daily observations through Atlas's same-origin API.
// Credentials remain exclusively on the server.
export async function fetchHistoricalData(
  symbol: string,
  startDate: string,
  endDate: string,
  options: LoadOptions = {},
): Promise<HistoricalDataResponse> {
  const request = createHistoricalDataRequest(
    symbol,
    startDate,
    endDate,
  )

  const params = new URLSearchParams({
    symbol: request.symbol,
    start: request.startDate,
    end: request.endDate,
    timeframe: request.timeframe,
  })

  const fetchImpl = options.fetchImpl ?? fetch

  const response = await fetchImpl(
    `/api/market-data?${params.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: options.signal,
      cache: 'no-store',
    },
  )

  let body: unknown

  try {
    body = await response.json()
  } catch {
    throw new HistoricalDataClientError(
      'Market-data service returned invalid JSON.',
      'INVALID_RESPONSE',
      response.status,
    )
  }

  if (!response.ok) {
    const error =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : 'Historical market-data request failed.'

    const code =
      typeof body === 'object' &&
      body !== null &&
      'code' in body &&
      typeof body.code === 'string'
        ? body.code
        : 'REQUEST_FAILED'

    throw new HistoricalDataClientError(
      error,
      code,
      response.status,
    )
  }

  try {
    return validateHistoricalResponseForRequest(
      body,
      request,
    )
  } catch {
    throw new HistoricalDataClientError(
      'Market-data response failed validation.',
      'INVALID_RESPONSE',
      response.status,
    )
  }
}
