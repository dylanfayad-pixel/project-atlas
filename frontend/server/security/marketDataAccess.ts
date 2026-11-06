import type { IncomingMessage } from 'node:http'
import { timingSafeEqual } from 'node:crypto'

// Authenticate trusted server-side API clients.
// Never expose this token in browser JavaScript.
export function authorizeMarketDataRequest(
  request: IncomingMessage,
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const expected = environment.MARKET_DATA_ACCESS_TOKEN

  if (!expected || expected.length < 32) return false

  const authorization = request.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return false
  }

  const supplied = authorization.slice(7)
  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(supplied)

  if (expectedBuffer.length !== suppliedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, suppliedBuffer)
}
