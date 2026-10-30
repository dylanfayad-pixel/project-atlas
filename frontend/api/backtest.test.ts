// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Readable } from 'node:stream'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import handler from './backtest'
import { validResponse } from '../src/lib/backtestTestFixture'

type Result = {
  status: number
  headers: Record<string, string>
  body: Record<string, unknown>
}

async function invoke(
  method: string,
  body = '{}'
): Promise<Result> {
  const request = Object.assign(
    Readable.from([Buffer.from(body)]),
    { method, url: '/api/backtest' }
  ) as IncomingMessage

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
    body: JSON.parse(output) as Record<string, unknown>,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Atlas backtest API gateway', () => {
  it('rejects unsupported methods', async () => {
    const result = await invoke('GET')

    expect(result.status).toBe(405)
    expect(result.headers.allow).toBe('POST')
  })

  it('reports missing backend configuration', async () => {
    vi.stubEnv('ATLAS_BACKTEST_URL', '')

    const result = await invoke('POST')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('BACKEND_NOT_CONFIGURED')
  })

  it('rejects malformed JSON', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )

    const result = await invoke('POST', '{invalid')

    expect(result.status).toBe(400)
    expect(result.body.code).toBe('INVALID_REQUEST')
  })

  it('rejects oversized requests', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )

    const result = await invoke(
      'POST',
      JSON.stringify({ data: 'x'.repeat(2 * 1024 * 1024) })
    )

    expect(result.status).toBe(413)
    expect(result.body.code).toBe('REQUEST_TOO_LARGE')
  })

  it('forwards successful backtest results', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )

    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(validResponse())
    )

    vi.stubGlobal('fetch', fetchMock)

    const result = await invoke(
      'POST',
      JSON.stringify({
        strategy: 'buy-and-hold',
        bars: [],
      })
    )

    expect(result.status).toBe(200)
    expect(result.body.response_version).toBe(1)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('forwards the configured service credential', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )
    vi.stubEnv(
      'ATLAS_BACKTEST_SERVICE_KEY',
      'test-service-credential'
    )

    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(validResponse())
    )

    vi.stubGlobal('fetch', fetchMock)

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(200)

    const options = fetchMock.mock.calls[0][1] as RequestInit
    const headers = options.headers as Record<string, string>

    expect(headers['X-Atlas-Service-Key']).toBe(
      'test-service-credential'
    )

    expect(JSON.stringify(result.body)).not.toContain(
      'test-service-credential'
    )
  })

  it('does not forward a credential when unconfigured', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )
    vi.stubEnv('ATLAS_BACKTEST_SERVICE_KEY', '')

    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(validResponse())
    )

    vi.stubGlobal('fetch', fetchMock)

    await invoke('POST', '{}')

    const options = fetchMock.mock.calls[0][1] as RequestInit
    const headers = options.headers as Record<string, string>

    expect(headers).not.toHaveProperty(
      'X-Atlas-Service-Key'
    )
  })

  it('rejects malformed financial results', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )

    const invalid = validResponse()
    invalid.portfolio.trades[0].quantity = -1

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(invalid)
      )
    )

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('UPSTREAM_UNAVAILABLE')
  })

  it('handles upstream failures safely', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        new Error('Connection failed')
      )
    )

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('UPSTREAM_UNAVAILABLE')
  })

  it('rejects insecure production backend URLs', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'http://backend.example.com'
    )
    vi.stubEnv(
      'ATLAS_BACKTEST_SERVICE_KEY',
      'test-secret'
    )

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('BACKEND_NOT_CONFIGURED')
  })

  it('requires a service key in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )
    vi.stubEnv('ATLAS_BACKTEST_SERVICE_KEY', '')

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('BACKEND_NOT_CONFIGURED')
  })

  it('rejects backend URLs containing credentials', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://user:pass@backend.example.com'
    )

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('BACKEND_NOT_CONFIGURED')
  })

  it('rejects oversized upstream responses', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('x'.repeat(8 * 1024 * 1024 + 1), {
          status: 200,
        })
      )
    )

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('UPSTREAM_UNAVAILABLE')
  })

  it('rejects malformed upstream JSON', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{invalid', { status: 200 })
      )
    )

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('UPSTREAM_UNAVAILABLE')
  })

  it('rejects localhost as a production backend', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://localhost:8765'
    )
    vi.stubEnv(
      'ATLAS_BACKTEST_SERVICE_KEY',
      'test-secret'
    )

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('BACKEND_NOT_CONFIGURED')
  })

  it('rejects literal IP backend addresses in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://127.0.0.1:8765'
    )
    vi.stubEnv(
      'ATLAS_BACKTEST_SERVICE_KEY',
      'test-secret'
    )

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('BACKEND_NOT_CONFIGURED')
  })

  it('disables upstream redirects', async () => {
    vi.stubEnv(
      'ATLAS_BACKTEST_URL',
      'https://backend.example.com'
    )

    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(validResponse())
    )

    vi.stubGlobal('fetch', fetchMock)

    const result = await invoke('POST', '{}')

    expect(result.status).toBe(200)

    const options = fetchMock.mock.calls[0][1] as RequestInit
    expect(options.redirect).toBe('error')
  })

  it('disables response caching', async () => {
    vi.stubEnv('ATLAS_BACKTEST_URL', '')

    const result = await invoke('POST')

    expect(result.headers['cache-control']).toBe('no-store')
  })
})
