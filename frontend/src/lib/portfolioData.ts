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

// Schema v1 remains supported for existing portfolio fixtures.
type PortfolioBase = {
  strategy: string
  initial_capital: number
  final_equity: number
  net_profit: number
  total_return_pct: number
  maximum_drawdown_pct: number
  equity_curve: EquityPoint[]
}

export type PortfolioV1 = PortfolioBase & {
  schema_version: 1
  trades: PortfolioTrade[]
}

export type PortfolioV2Trade = PortfolioTrade & {
  commission_paid: number
  slippage_cost: number
}

export type PortfolioV2 = PortfolioBase & {
  schema_version: 2
  total_commission: number
  total_slippage_cost: number
  total_execution_cost: number
  trades: PortfolioV2Trade[]
}

// Schema v3 extends cost-aware portfolio results with
// quantitative risk analytics and execution-policy events.
export type PortfolioRiskMetrics = {
  return_observations: number
  periods_per_year: number
  risk_free_rate_per_period: number
  target_return_per_period: number
  annualized_volatility_pct: number | null
  sharpe_ratio: number | null
  downside_deviation_pct: number | null
  sortino_ratio: number | null
}

export type PortfolioExposurePoint = {
  index: number
  timestamp: string
  fraction: number
}

export type PortfolioRiskEvent = {
  index: number
  timestamp: string
  type:
    | 'DRAWDOWN_BREACH'
    | 'LIQUIDATION_EXECUTED'
    | 'LIQUIDATION_REJECTED'
  drawdown_fraction: number
}

export type PortfolioV3 = Omit<PortfolioV2, 'schema_version'> & {
  schema_version: 3
  risk_metrics: PortfolioRiskMetrics
  exposure: {
    observations: PortfolioExposurePoint[]
    maximum_observed_fraction: number
  }
  risk_controls: {
    max_entry_allocation: number
    max_entry_exposure: number
    max_drawdown_fraction: number
    liquidate_on_drawdown: boolean
    events: PortfolioRiskEvent[]
  }
}

export type PortfolioData = PortfolioV1 | PortfolioV2 | PortfolioV3

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

  if (value.schema_version !== 1 &&
      value.schema_version !== 2 &&
      value.schema_version !== 3) {
    throw new Error('Unsupported portfolio schema version')
  }

  const schemaVersion = value.schema_version

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

  if (schemaVersion >= 2) {
    const commission = value.total_commission
    const slippage = value.total_slippage_cost
    const total = value.total_execution_cost

    if (!isFiniteNumber(commission) ||
        !isFiniteNumber(slippage) ||
        !isFiniteNumber(total) ||
        commission < 0 ||
        slippage < 0 ||
        total < 0) {
      throw new Error('Invalid portfolio execution costs')
    }

    let tradeCommission = 0
    let tradeSlippage = 0

    for (const trade of value.trades) {
      // A v2 trade must explicitly contain both cost fields.
      // The 'in' checks safely narrow the legacy trade type.
      if (!('commission_paid' in trade) ||
          !('slippage_cost' in trade)) {
        throw new Error('Missing trade execution costs')
      }

      const commissionPaid = trade.commission_paid
      const slippageCost = trade.slippage_cost

      if (!isFiniteNumber(commissionPaid) ||
          !isFiniteNumber(slippageCost) ||
          commissionPaid < 0 ||
          slippageCost < 0) {
        throw new Error('Invalid trade execution costs')
      }

      tradeCommission += commissionPaid
      tradeSlippage += slippageCost
    }

    const matches = (actual: number, expected: number) =>
      Number.isFinite(actual) &&
      Number.isFinite(expected) &&
      Math.abs(actual - expected) <=
        1e-7 * Math.max(1, Math.abs(actual), Math.abs(expected))

    if (!matches(commission, tradeCommission) ||
        !matches(slippage, tradeSlippage) ||
        !matches(total, commission + slippage)) {
      throw new Error('Execution cost totals disagree')
    }
  }

  if (schemaVersion === 3) {
    const metrics = value.risk_metrics
    const exposure = value.exposure
    const controls = value.risk_controls

    if (!isRecord(metrics) ||
        !isRecord(exposure) ||
        !isRecord(controls)) {
      throw new Error('Missing JSON v3 risk reporting')
    }

    if (!isNonNegativeInteger(metrics.return_observations) ||
        !isFiniteNumber(metrics.periods_per_year) ||
        metrics.periods_per_year <= 0 ||
        !isFiniteNumber(metrics.risk_free_rate_per_period) ||
        !isFiniteNumber(metrics.target_return_per_period)) {
      throw new Error('Invalid risk sampling configuration')
    }

    const optionalMetrics = [
      'annualized_volatility_pct',
      'sharpe_ratio',
      'downside_deviation_pct',
      'sortino_ratio',
    ] as const

    for (const field of optionalMetrics) {
      const statistic = metrics[field]
      if (statistic !== null && !isFiniteNumber(statistic)) {
        throw new Error('Invalid optional risk statistic')
      }
    }

    if (!Array.isArray(exposure.observations) ||
        !isFiniteNumber(exposure.maximum_observed_fraction) ||
        exposure.maximum_observed_fraction < 0 ||
        exposure.maximum_observed_fraction > 1) {
      throw new Error('Invalid exposure reporting')
    }

    if (exposure.observations.length !== value.equity_curve.length) {
      throw new Error('Exposure observation count mismatch')
    }

    let maximumExposure = 0

    for (let i = 0; i < exposure.observations.length; i++) {
      const point = exposure.observations[i]
      const equity = value.equity_curve[i]

      if (!isRecord(point) ||
          point.index !== i ||
          point.timestamp !== equity.timestamp ||
          !isFiniteNumber(point.fraction) ||
          point.fraction < 0 ||
          point.fraction > 1) {
        throw new Error('Invalid exposure observation')
      }

      if (equity.equity <= 0) {
        throw new Error('Exposure requires positive equity')
      }

      const expected = (equity.equity - equity.cash) / equity.equity

      if (!isFiniteNumber(expected) ||
          Math.abs(point.fraction - expected) > 1e-7) {
        throw new Error('Exposure accounting mismatch')
      }

      maximumExposure = Math.max(maximumExposure, point.fraction)
    }

    if (Math.abs(maximumExposure -
        exposure.maximum_observed_fraction) > 1e-7) {
      throw new Error('Maximum exposure mismatch')
    }

    if (!isFiniteNumber(controls.max_entry_allocation) ||
        controls.max_entry_allocation < 0 ||
        controls.max_entry_allocation > 1 ||
        !isFiniteNumber(controls.max_entry_exposure) ||
        controls.max_entry_exposure < 0 ||
        controls.max_entry_exposure > 1 ||
        !isFiniteNumber(controls.max_drawdown_fraction) ||
        controls.max_drawdown_fraction <= 0 ||
        controls.max_drawdown_fraction > 1 ||
        typeof controls.liquidate_on_drawdown !== 'boolean' ||
        !Array.isArray(controls.events)) {
      throw new Error('Invalid risk-control configuration')
    }

    let previousIndex = -1
    let breachIndex = -1

    for (const event of controls.events) {
      if (!isRecord(event) ||
          !isNonNegativeInteger(event.index) ||
          event.index >= value.equity_curve.length ||
          event.index < previousIndex ||
          event.timestamp !== value.equity_curve[event.index].timestamp ||
          !isFiniteNumber(event.drawdown_fraction) ||
          event.drawdown_fraction < 0 ||
          event.drawdown_fraction > 1) {
        throw new Error('Invalid risk-event observation')
      }

      if (event.type === 'DRAWDOWN_BREACH') {
        if (breachIndex !== -1 ||
            controls.max_drawdown_fraction === 1 ||
            event.drawdown_fraction + 1e-12 <
              controls.max_drawdown_fraction) {
          throw new Error('Invalid drawdown breach')
        }
        breachIndex = event.index
      } else if (event.type === 'LIQUIDATION_EXECUTED' ||
                 event.type === 'LIQUIDATION_REJECTED') {
        if (breachIndex < 0 ||
            event.index <= breachIndex ||
            !controls.liquidate_on_drawdown) {
          throw new Error('Invalid liquidation event')
        }

        const sells = value.trades.filter(
          (trade) => trade.index === event.index &&
            trade.timestamp === event.timestamp &&
            trade.side === 'SELL'
        )

        if (event.type === 'LIQUIDATION_EXECUTED' &&
            sells.length !== 1) {
          throw new Error('Missing liquidation SELL fill')
        }

        if (event.type === 'LIQUIDATION_REJECTED' &&
            sells.length !== 0) {
          throw new Error('Rejected liquidation has SELL fill')
        }
      } else {
        throw new Error('Unknown risk-event type')
      }

      previousIndex = event.index
    }

    if (metrics.return_observations !==
        Math.max(0, value.equity_curve.length - 1)) {
      throw new Error('Risk return observation count mismatch')
    }
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
