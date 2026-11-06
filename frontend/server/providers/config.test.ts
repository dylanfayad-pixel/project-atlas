// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createConfiguredMarketDataProvider } from './config'
import { MassiveHistoricalProvider } from './massiveClient'

describe('Market-data provider configuration', () => {
  it('remains disabled without explicit configuration', () => {
    expect(
      createConfiguredMarketDataProvider({}),
    ).toBeNull()
  })

  it('remains disabled when credentials are missing', () => {
    expect(
      createConfiguredMarketDataProvider({
        MARKET_DATA_PROVIDER: 'massive',
      }),
    ).toBeNull()
  })

  it('creates Massive only with explicit credentials', () => {
    const provider = createConfiguredMarketDataProvider({
      MARKET_DATA_PROVIDER: 'massive',
      MARKET_DATA_API_KEY: 'test-secret',
    })

    expect(provider).toBeInstanceOf(MassiveHistoricalProvider)
    expect(provider?.name).toBe('massive')
  })

  it('rejects unsupported provider configurations', () => {
    expect(() =>
      createConfiguredMarketDataProvider({
        MARKET_DATA_PROVIDER: 'unknown',
        MARKET_DATA_API_KEY: 'test-secret',
      }),
    ).toThrow('Unsupported market-data provider')
  })
})
