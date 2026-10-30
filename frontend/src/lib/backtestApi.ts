import type { OhlcvBar } from './ohlcvData'

export type BacktestStrategy =
  | 'buy-and-hold'
  | 'sma-crossover'

export type BacktestConfig = {
  strategy: BacktestStrategy
  capital: number
  commission: number
  slippage_bps: number
  fast: number
  slow: number
}

export type BacktestSignal = {
  index: number
  timestamp: string
  signal: 'BUY' | 'SELL' | 'HOLD'
}

export type BacktestEquityPoint = {
  index: number
  timestamp: string
  cash: number
  shares: number
  equity: number
}

export type BacktestTrade = {
  index: number
  timestamp: string
  side: 'BUY' | 'SELL'
  price: number
  quantity: number
  commission_paid: number
  slippage_cost: number
}

export type BacktestRiskMetrics = {
  return_observations: number
  periods_per_year: number
  risk_free_rate_per_period: number
  target_return_per_period: number
  annualized_volatility_pct: number
  sharpe_ratio: number | null
  downside_deviation_pct: number
  sortino_ratio: number | null
}

export type BacktestResult = {
  response_version: 1
  signals: BacktestSignal[]
  portfolio: {
    schema_version: 3
    strategy: string
    initial_capital: number
    final_equity: number
    total_return_pct: number
    maximum_drawdown_pct: number
    trades: BacktestTrade[]
    equity_curve: BacktestEquityPoint[]
    risk_metrics: BacktestRiskMetrics
    [key: string]: unknown
  }
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' &&
    Number.isFinite(value)
}

function validIndex(value: unknown): value is number {
  return Number.isSafeInteger(value) &&
    typeof value === 'number' &&
    value >= 0
}

function validEquityPoint(value: unknown): boolean {
  if (!isRecord(value)) return false

  return validIndex(value.index) &&
    typeof value.timestamp === 'string' &&
    finiteNumber(value.cash) &&
    finiteNumber(value.shares) &&
    finiteNumber(value.equity) &&
    value.cash >= 0 &&
    value.shares >= 0 &&
    value.equity >= 0
}

function validTrade(value: unknown): boolean {
  if (!isRecord(value)) return false

  return validIndex(value.index) &&
    typeof value.timestamp === 'string' &&
    (value.side === 'BUY' || value.side === 'SELL') &&
    finiteNumber(value.price) &&
    finiteNumber(value.quantity) &&
    finiteNumber(value.commission_paid) &&
    finiteNumber(value.slippage_cost) &&
    value.price > 0 &&
    value.quantity > 0 &&
    value.commission_paid >= 0 &&
    value.slippage_cost >= 0
}

function validRiskMetrics(value: unknown): boolean {
  if (!isRecord(value)) return false

  const required = [
    'periods_per_year',
    'risk_free_rate_per_period',
    'target_return_per_period',
    'annualized_volatility_pct',
    'downside_deviation_pct',
  ]

  if (!validIndex(value.return_observations)) {
    return false
  }

  if (!required.every((key) => finiteNumber(value[key]))) {
    return false
  }

  if (
    typeof value.periods_per_year !== 'number' ||
    value.periods_per_year <= 0 ||
    typeof value.annualized_volatility_pct !== 'number' ||
    value.annualized_volatility_pct < 0 ||
    typeof value.downside_deviation_pct !== 'number' ||
    value.downside_deviation_pct < 0
  ) {
    return false
  }

  return ['sharpe_ratio', 'sortino_ratio'].every(
    (key) =>
      value[key] === null ||
      finiteNumber(value[key])
  )
}

// Reject unexpected or malformed engine responses.
export function parseBacktestResult(
  value: unknown
): BacktestResult {
  if (!isRecord(value) || value.response_version !== 1) {
    throw new Error('Unsupported backtest response.')
  }

  if (!Array.isArray(value.signals)) {
    throw new Error('Missing backtest signals.')
  }

  for (const event of value.signals) {
    if (
      !isRecord(event) ||
      !Number.isSafeInteger(event.index) ||
      typeof event.timestamp !== 'string' ||
      !['BUY', 'SELL', 'HOLD'].includes(
        String(event.signal)
      )
    ) {
      throw new Error('Invalid backtest signal.')
    }
  }

  const portfolio = value.portfolio

  if (
    !isRecord(portfolio) ||
    portfolio.schema_version !== 3 ||
    typeof portfolio.strategy !== 'string' ||
    !Array.isArray(portfolio.trades) ||
    !Array.isArray(portfolio.equity_curve)
  ) {
    throw new Error('Invalid backtest portfolio.')
  }

  for (const field of [
    'initial_capital',
    'final_equity',
    'total_return_pct',
    'maximum_drawdown_pct',
  ]) {
    if (
      typeof portfolio[field] !== 'number' ||
      !Number.isFinite(portfolio[field])
    ) {
      throw new Error(`Invalid portfolio field: ${field}`)
    }
  }

  if (
    !portfolio.equity_curve.every(validEquityPoint) ||
    !portfolio.trades.every(validTrade) ||
    !validRiskMetrics(portfolio.risk_metrics)
  ) {
    throw new Error('Malformed backtest results.')
  }

  return value as BacktestResult
}

// Submit the active research dataset to the local C++ service.
export async function runBacktest(
  bars: OhlcvBar[],
  config: BacktestConfig,
  signal?: AbortSignal
): Promise<BacktestResult> {
  const response = await fetch('/local-backtest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bars,
      ...config,
    }),
    signal,
  })

  if (!response.ok) {
    let message = `Backtest service returned HTTP ${response.status}.`

    try {
      const body: unknown = await response.json()

      if (
        isRecord(body) &&
        typeof body.error === 'string' &&
        body.error.length > 0 &&
        body.error.length <= 200
      ) {
        message = body.error
      }
    } catch {
      // Preserve the HTTP status if the error body is malformed.
    }

    throw new Error(message)
  }

  return parseBacktestResult(await response.json())
}
