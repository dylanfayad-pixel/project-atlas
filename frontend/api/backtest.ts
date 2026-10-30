import type { IncomingMessage, ServerResponse } from 'node:http'
import { parseBacktestResult } from '../src/lib/backtestApi'


const MAX_BODY_BYTES = 2 * 1024 * 1024
const UPSTREAM_TIMEOUT_MS = 8000

const MAX_UPSTREAM_BYTES = 8 * 1024 * 1024

// Production requires HTTPS and a server-side service credential.
// Reject obvious private or local destinations in production.
function forbiddenProductionHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\\.$/, '')

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.test') ||
    host.endsWith('.invalid') ||
    host.endsWith('.example') ||
    host.endsWith('.example.com') ||
    host.endsWith('.example.net') ||
    host.endsWith('.example.org')
  ) {
    return true
  }

  // Reject literal IP addresses; production should use
  // a verified public DNS hostname.
  if (/^[0-9.]+$/.test(host) || host.includes(':') ||
      host.startsWith('[')) {
    return true
  }

  return false
}

function resolveBackend(): URL | null {
  const raw = process.env.ATLAS_BACKTEST_URL
  const key = process.env.ATLAS_BACKTEST_SERVICE_KEY
  const production = process.env.NODE_ENV === 'production'

  if (!raw || (production && !key)) {
    return null
  }

  try {
    const url = new URL(raw)

    if (url.username || url.password ||
        url.search || url.hash ||
        url.pathname !== '/') {
      return null
    }

    if (production && (
      url.protocol !== 'https:' ||
      forbiddenProductionHost(url.hostname)
    )) {
      return null
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null
    }

    return url
  } catch {
    return null
  }
}

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

// Read request streams with an explicit size limit.
async function readBody(
  request: IncomingMessage
): Promise<string> {
  let size = 0
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk)

    size += buffer.length

    if (size > MAX_BODY_BYTES) {
      throw new Error('REQUEST_TOO_LARGE')
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks).toString('utf8')
}

// Read upstream JSON without allowing unbounded memory growth.
async function readUpstreamJson(
  response: Response
): Promise<unknown> {
  const reader = response.body?.getReader()

  if (!reader) {
    throw new Error('Missing upstream response body')
  }

  const chunks: Uint8Array[] = []
  let size = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      size += value.byteLength

      if (size > MAX_UPSTREAM_BYTES) {
        throw new Error('Upstream response too large')
      }

      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(size)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return JSON.parse(new TextDecoder().decode(bytes))
}

// Forward validated JSON to the configured execution service.
export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, {
      error: 'Only POST requests are supported.',
      code: 'METHOD_NOT_ALLOWED',
    } satisfies ApiError)
    return
  }

  const backend = resolveBackend()

  if (!backend) {
    sendJson(response, 503, {
      error: 'Backtesting service is not configured.',
      code: 'BACKEND_NOT_CONFIGURED',
    } satisfies ApiError)
    return
  }

  let payload: unknown

  try {
    const body = await readBody(request)
    payload = JSON.parse(body)
  } catch (error) {
    const oversized =
      error instanceof Error &&
      error.message === 'REQUEST_TOO_LARGE'

    sendJson(response, oversized ? 413 : 400, {
      error: oversized
        ? 'Backtest request exceeds size limit.'
        : 'Invalid backtest JSON.',
      code: oversized
        ? 'REQUEST_TOO_LARGE'
        : 'INVALID_REQUEST',
    } satisfies ApiError)
    return
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    sendJson(response, 400, {
      error: 'Invalid backtest request.',
      code: 'INVALID_REQUEST',
    } satisfies ApiError)
    return
  }

  try {
    const upstream = await fetch(
      new URL('/backtest', backend),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.ATLAS_BACKTEST_SERVICE_KEY
            ? {
                'X-Atlas-Service-Key':
                  process.env.ATLAS_BACKTEST_SERVICE_KEY,
              }
            : {}),
        },
        body: JSON.stringify(payload),
        redirect: 'error',
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      }
    )

    const result: unknown = await readUpstreamJson(upstream)

    if (
      ![200, 400, 413, 422, 503, 504].includes(upstream.status)
    ) {
      throw new Error('Unexpected upstream response')
    }

    if (upstream.status === 200) {
      // Never return unverified financial results to the browser.
      const validated = parseBacktestResult(result)
      sendJson(response, 200, validated)
      return
    }

    sendJson(response, upstream.status, result)
  } catch {
    sendJson(response, 503, {
      error: 'Backtesting service is unavailable.',
      code: 'UPSTREAM_UNAVAILABLE',
    } satisfies ApiError)
  }
}
