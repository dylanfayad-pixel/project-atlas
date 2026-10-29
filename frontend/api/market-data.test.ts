// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import handler from './market-data'

type Result = {
  status: number
  headers: Record<string, string>
  body: {
    error: string
    code: string
  }
}

// Minimal HTTP doubles let us verify the handler without
// starting a server or contacting an external provider.
async function invoke(
  method: string,
  url: string
): Promise<Result> {
  const request = {
    method,
    url,
  } as IncomingMessage

  const headers: Record<string, string> = {}
  let output = ''

  const response = Object.assign(new EventEmitter(), {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value
      return this
    },
    end(value?: string) {
      output = value ?? ''
      return this
    },
  }) as unknown as ServerResponse

  await handler(request, response)

  return {
    status: response.statusCode,
    headers,
    body: JSON.parse(output),
  }
}

describe('Historical market-data API', () => {
  const validUrl =
    '/api/market-data?symbol=AAPL&start=2025-01-01&end=2025-12-31'

  it('rejects unsupported methods', async () => {
    const result = await invoke('POST', validUrl)

    expect(result.status).toBe(405)
    expect(result.body.code).toBe('METHOD_NOT_ALLOWED')
    expect(result.headers.allow).toBe('GET')
  })

  it('rejects missing parameters', async () => {
    const result = await invoke('GET', '/api/market-data')

    expect(result.status).toBe(400)
    expect(result.body.code).toBe('INVALID_REQUEST')
  })

  it('rejects invalid ticker symbols', async () => {
    const result = await invoke(
      'GET',
      '/api/market-data?symbol=BAD!&start=2025-01-01&end=2025-12-31'
    )

    expect(result.status).toBe(400)
  })

  it('rejects unsupported timeframes', async () => {
    const result = await invoke(
      'GET',
      validUrl + '&timeframe=1m'
    )

    expect(result.status).toBe(400)
  })

  it('rejects reversed dates', async () => {
    const result = await invoke(
      'GET',
      '/api/market-data?symbol=AAPL&start=2025-12-31&end=2025-01-01'
    )

    expect(result.status).toBe(400)
  })

  it('reports an unconfigured provider', async () => {
    const result = await invoke('GET', validUrl)

    expect(result.status).toBe(503)
    expect(result.body.code).toBe(
      'PROVIDER_NOT_CONFIGURED'
    )
  })

  it('disables response caching', async () => {
    const result = await invoke('GET', validUrl)

    expect(result.headers['cache-control']).toBe(
      'no-store'
    )
  })

  it('rejects duplicate ticker parameters', async () => {
    const result = await invoke(
      'GET',
      validUrl + '&symbol=MSFT'
    )

    expect(result.status).toBe(400)
    expect(result.body.code).toBe('INVALID_REQUEST')
  })

  it('rejects unexpected query parameters', async () => {
    const result = await invoke(
      'GET',
      validUrl + '&admin=true'
    )

    expect(result.status).toBe(400)
    expect(result.body.code).toBe('INVALID_REQUEST')
  })

  it('rejects oversized request URLs', async () => {
    const result = await invoke(
      'GET',
      validUrl + '&padding=' + 'x'.repeat(3000)
    )

    expect(result.status).toBe(400)
    expect(result.body.code).toBe('INVALID_REQUEST')
  })

  it('returns JSON content type', async () => {
    const result = await invoke('GET', validUrl)

    expect(result.headers['content-type']).toBe(
      'application/json'
    )
  })
})
