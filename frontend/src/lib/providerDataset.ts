import type { HistoricalDataResponse } from './historicalDataResponse'
import type { ResearchDataset } from './researchSession'

// Convert an already-validated provider response into an
// independent research dataset without changing its observations.
export function createProviderDataset(
  response: HistoricalDataResponse,
): ResearchDataset {
  if (response.bars.length === 0) {
    throw new Error('Cannot create an empty provider dataset.')
  }

  return {
    id: crypto.randomUUID(),
    source: 'provider',
    filename: null,
    symbol: response.symbol,
    exchange: null,
    instrumentVerified: false,
    provenance: {
      provider: response.provider,
      retrievedAt: response.retrieved_at,
      adjusted: response.adjusted,
      requestedStartDate: response.start_date,
      requestedEndDate: response.end_date,
    },
    timeframe: '1d',
    bars: response.bars.map((bar) => ({ ...bar })),
    firstTimestamp: response.bars[0].timestamp,
    lastTimestamp: response.bars[response.bars.length - 1].timestamp,
  }
}
