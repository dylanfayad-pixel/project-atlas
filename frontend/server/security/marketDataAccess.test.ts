// @vitest-environment node

import { describe, expect, it } from 'vitest'
import type { IncomingMessage } from 'node:http'
import { authorizeMarketDataRequest } from './marketDataAccess'

const token = 'a'.repeat(48)

function request(authorization?: string): IncomingMessage {
  return {
    headers: authorization ? { authorization } : {},
  } as IncomingMessage
}

describe('Market-data API access policy', () => {
  it('rejects missing configuration', () => {
    expect(authorizeMarketDataRequest(
      request(`Bearer ${token}`), {},
    )).toBe(false)
  })

  it('rejects unauthenticated requests', () => {
    expect(authorizeMarketDataRequest(
      request(),
      { MARKET_DATA_ACCESS_TOKEN: token },
    )).toBe(false)
  })

  it('rejects incorrect credentials', () => {
    expect(authorizeMarketDataRequest(
      request(`Bearer ${'b'.repeat(48)}`),
      { MARKET_DATA_ACCESS_TOKEN: token },
    )).toBe(false)
  })

  it('accepts valid credentials', () => {
    expect(authorizeMarketDataRequest(
      request(`Bearer ${token}`),
      { MARKET_DATA_ACCESS_TOKEN: token },
    )).toBe(true)
  })

  it('rejects weak configuration', () => {
    expect(authorizeMarketDataRequest(
      request('Bearer short'),
      { MARKET_DATA_ACCESS_TOKEN: 'short' },
    )).toBe(false)
  })
})
