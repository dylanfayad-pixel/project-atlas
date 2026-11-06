import { MassiveHistoricalProvider } from './massiveClient.js'
import type { HistoricalMarketDataProvider } from './types.js'

// Create a market-data provider only when explicitly configured.
// Never expose credentials through browser environment variables.
export function createConfiguredMarketDataProvider(
  environment: NodeJS.ProcessEnv = process.env,
): HistoricalMarketDataProvider | null {
  const provider = environment.MARKET_DATA_PROVIDER?.trim()
  const apiKey = environment.MARKET_DATA_API_KEY?.trim()

  if (!provider) return null

  if (provider !== 'massive') {
    throw new Error('Unsupported market-data provider configuration.')
  }

  if (!apiKey) return null

  return new MassiveHistoricalProvider(apiKey)
}
