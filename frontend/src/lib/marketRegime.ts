import type { MarketAnalytics } from './marketAnalytics'

export type TrendRegime =
  | 'bullish'
  | 'bearish'
  | 'sideways'
  | 'insufficient-data'

export type VolatilityRegime =
  | 'high'
  | 'normal'
  | 'insufficient-data'

export type MarketRegime = {
  trend: TrendRegime
  volatility: VolatilityRegime
  reasons: string[]
}

// These thresholds are explicit research conventions,
// not empirically validated trading signals.
const MIN_TREND_OBSERVATIONS = 50
const HIGH_VOLATILITY_THRESHOLD_PCT = 30

// Classify historical conditions without forecasting returns.
export function classifyMarketRegime(
  analysis: MarketAnalytics,
): MarketRegime {
  const reasons: string[] = []

  let trend: TrendRegime = 'insufficient-data'

  if (
    analysis.observations >= MIN_TREND_OBSERVATIONS &&
    analysis.sma20 !== null &&
    analysis.sma50 !== null
  ) {
    if (
      analysis.latestClose > analysis.sma20 &&
      analysis.sma20 > analysis.sma50
    ) {
      trend = 'bullish'
      reasons.push(
        'Latest close exceeds SMA 20, and SMA 20 exceeds SMA 50.',
      )
    } else if (
      analysis.latestClose < analysis.sma20 &&
      analysis.sma20 < analysis.sma50
    ) {
      trend = 'bearish'
      reasons.push(
        'Latest close is below SMA 20, and SMA 20 is below SMA 50.',
      )
    } else {
      trend = 'sideways'
      reasons.push(
        'Closing price and moving averages lack directional alignment.',
      )
    }
  } else {
    reasons.push(
      'At least 50 daily observations are required for trend classification.',
    )
  }

  let volatility: VolatilityRegime = 'insufficient-data'

  if (
    analysis.observations >= MIN_TREND_OBSERVATIONS &&
    analysis.annualizedVolatilityPct !== null
  ) {
    volatility =
      analysis.annualizedVolatilityPct >= HIGH_VOLATILITY_THRESHOLD_PCT
        ? 'high'
        : 'normal'

    reasons.push(
      volatility === 'high'
        ? 'Annualized historical volatility is at least 30%.'
        : 'Annualized historical volatility is below 30%.',
    )
  } else {
    reasons.push(
      'Insufficient observations for regime-level volatility classification.',
    )
  }

  return { trend, volatility, reasons }
}
