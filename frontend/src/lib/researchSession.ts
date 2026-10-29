import type { OhlcvBar } from './ohlcvData'

// A dataset's origin must remain explicit so the UI never
// confuses imported observations with synthetic fixtures.
export type ResearchDataSource =
  | 'uploaded-csv'
  | 'manual-entry'
  | 'demo'
  | 'provider'

export type ResearchTimeframe = '1d'

export type ResearchDataset = {
  id: string
  source: ResearchDataSource
  filename: string | null
  symbol: string | null
  exchange: string | null
  instrumentVerified: false
  timeframe: ResearchTimeframe
  bars: OhlcvBar[]
  firstTimestamp: string
  lastTimestamp: string
}

// Strategy settings describe research intentions.
// They do not imply that the engine has executed a backtest.
export type ResearchStrategyConfig = {
  strategy: 'sma-crossover'
  fastWindow: number
  slowWindow: number
  initialCapital: number
  commissionPerTrade: number
  slippageBps: number
}

export type ResearchSession = {
  dataset: ResearchDataset | null
  strategy: ResearchStrategyConfig
  status: 'no-data' | 'data-ready'
}

export const DEFAULT_STRATEGY: ResearchStrategyConfig = {
  strategy: 'sma-crossover',
  fastWindow: 20,
  slowWindow: 50,
  initialCapital: 10000,
  commissionPerTrade: 0,
  slippageBps: 0,
}

export function createResearchSession(): ResearchSession {
  return {
    dataset: null,
    strategy: { ...DEFAULT_STRATEGY },
    status: 'no-data',
  }
}

// Build a validated dataset record from already-parsed bars.
// The browser import currently supports daily observations only.
export function createUploadedDataset(
  filename: string,
  bars: OhlcvBar[]
): ResearchDataset {
  if (bars.length === 0) {
    throw new Error('Cannot create a dataset without observations')
  }

  return {
    id: crypto.randomUUID(),
    source: 'uploaded-csv',
    filename,
    symbol: null,
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}


// Manual observations use the same validated OHLCV
// structure as uploaded CSV data, but retain provenance.
export function createManualDataset(
  bars: OhlcvBar[]
): ResearchDataset {
  if (bars.length === 0) {
    throw new Error('Cannot create an empty manual dataset')
  }

  return {
    id: crypto.randomUUID(),
    source: 'manual-entry',
    filename: null,
    symbol: null,
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}
