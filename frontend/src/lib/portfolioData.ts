// Typed contract for portfolio results produced by the C++ engine.

export type PortfolioTrade = {
  index: number
  timestamp: string
  side: 'BUY' | 'SELL'
  price: number
  quantity: number
}

export type EquityPoint = {
  index: number
  timestamp: string
  cash: number
  shares: number
  equity: number
}

export type PortfolioData = {
  schema_version: 1
  strategy: string
  initial_capital: number
  final_equity: number
  net_profit: number
  total_return_pct: number
  maximum_drawdown_pct: number
  equity_curve: EquityPoint[]
  trades: PortfolioTrade[]
}

// Narrow unknown JSON objects before reading their fields.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) &&
    typeof value === 'number' &&
    value >= 0
}

// Check every equity observation before chart rendering.
function isEquityPoint(value: unknown): value is EquityPoint {
  if (!isRecord(value)) return false

  return isNonNegativeInteger(value.index) &&
    typeof value.timestamp === 'string' &&
    value.timestamp.length > 0 &&
    isFiniteNumber(value.cash) &&
    value.cash >= 0 &&
    isFiniteNumber(value.shares) &&
    value.shares >= 0 &&
    isFiniteNumber(value.equity) &&
    value.equity >= 0
}

// Check every simulated fill before displaying trade history.
function isPortfolioTrade(value: unknown): value is PortfolioTrade {
  if (!isRecord(value)) return false

  return isNonNegativeInteger(value.index) &&
    typeof value.timestamp === 'string' &&
    value.timestamp.length > 0 &&
    (value.side === 'BUY' || value.side === 'SELL') &&
    isFiniteNumber(value.price) &&
    value.price > 0 &&
    isFiniteNumber(value.quantity) &&
    value.quantity > 0
}

// Validate the complete JSON structure at the network boundary.
export function parsePortfolioData(value: unknown): PortfolioData {
  if (!isRecord(value)) {
    throw new Error('Invalid portfolio response')
  }

  if (value.schema_version !== 1) {
    throw new Error('Unsupported portfolio schema version')
  }

  if (typeof value.strategy !== 'string' ||
      value.strategy.trim().length === 0) {
    throw new Error('Invalid portfolio strategy')
  }

  if (!Array.isArray(value.equity_curve) ||
      !Array.isArray(value.trades)) {
    throw new Error('Invalid portfolio collections')
  }

  const numericFields = [
    'initial_capital',
    'final_equity',
    'net_profit',
    'total_return_pct',
    'maximum_drawdown_pct',
  ] as const

  for (const field of numericFields) {
    if (!isFiniteNumber(value[field])) {
      throw new Error(`Invalid portfolio field: ${field}`)
    }
  }

  // Narrow each numeric property explicitly so TypeScript
  // can safely use the values in arithmetic expressions.
  const initialCapital = value.initial_capital
  const finalEquity = value.final_equity
  const maximumDrawdown = value.maximum_drawdown_pct

  if (!isFiniteNumber(initialCapital) ||
      !isFiniteNumber(finalEquity) ||
      !isFiniteNumber(maximumDrawdown)) {
    throw new Error('Invalid portfolio numeric fields')
  }

  if (initialCapital <= 0 ||
      finalEquity < 0 ||
      maximumDrawdown < 0 ||
      maximumDrawdown > 100) {
    throw new Error('Portfolio metrics outside valid ranges')
  }

  if (!value.equity_curve.every(isEquityPoint)) {
    throw new Error('Invalid portfolio equity observation')
  }

  if (!value.trades.every(isPortfolioTrade)) {
    throw new Error('Invalid portfolio trade')
  }

  // Ensure observations are sequential and trades refer
  // to actual observations from the same simulation.
  for (let i = 0; i < value.equity_curve.length; i++) {
    if (value.equity_curve[i].index !== i) {
      throw new Error('Non-sequential equity curve')
    }
  }

  for (const trade of value.trades) {
    const point = value.equity_curve[trade.index]

    if (!point || point.timestamp !== trade.timestamp) {
      throw new Error('Trade does not match equity curve')
    }
  }

  // Confirm the summary matches the final equity observation.
  const last = value.equity_curve.at(-1)
  const expectedFinal = last?.equity ?? initialCapital

  if (!isFiniteNumber(expectedFinal)) {
    throw new Error('Invalid final equity observation')
  }

  if (Math.abs(finalEquity - expectedFinal) >
      1e-7 * Math.max(1, Math.abs(expectedFinal))) {
    throw new Error('Portfolio summary and equity curve disagree')
  }

  return value as PortfolioData
}
