import type { OhlcvBar } from './ohlcvData.js'

// Annualization assumes daily observations and 252 trading days.
const TRADING_DAYS = 252

export type MarketAnalytics = {
  observations: number
  firstTimestamp: string
  lastTimestamp: string
  latestClose: number
  totalReturnPct: number | null
  annualizedVolatilityPct: number | null
  maximumDrawdownPct: number
  sma20: number | null
  sma50: number | null
  rsi14: number | null
}

// Calculate the mean of a nonempty numeric series.
function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) /
    values.length
}

// Sample standard deviation avoids treating a single
// return observation as sufficient volatility evidence.
function sampleStandardDeviation(values: number[]): number | null {
  if (values.length < 2) return null

  const average = mean(values)
  const squared = values.reduce(
    (sum, value) => sum + (value - average) ** 2,
    0,
  )

  return Math.sqrt(squared / (values.length - 1))
}

// Calculate the latest simple moving average.
export function simpleMovingAverage(
  values: number[],
  period: number,
): number | null {
  if (!Number.isSafeInteger(period) ||
      period < 1 ||
      values.length < period) {
    return null
  }

  return mean(values.slice(-period))
}

// Wilder RSI with an initial 14-period average followed
// by recursively smoothed gains and losses.
export function relativeStrengthIndex(
  closes: number[],
  period = 14,
): number | null {
  if (!Number.isSafeInteger(period) ||
      period < 1 ||
      closes.length <= period) {
    return null
  }

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]
    gains += Math.max(change, 0)
    losses += Math.max(-change, 0)
  }

  let averageGain = gains / period
  let averageLoss = losses / period

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]

    averageGain = (
      averageGain * (period - 1) +
      Math.max(change, 0)
    ) / period

    averageLoss = (
      averageLoss * (period - 1) +
      Math.max(-change, 0)
    ) / period
  }

  if (averageGain === 0 && averageLoss === 0) return 50
  if (averageLoss === 0) return 100
  if (averageGain === 0) return 0

  const relativeStrength = averageGain / averageLoss
  return 100 - 100 / (1 + relativeStrength)
}

// Analyze validated daily OHLCV observations without
// executing trades or simulating portfolio performance.
export function analyzeMarket(
  bars: OhlcvBar[],
): MarketAnalytics {
  if (bars.length === 0) {
    throw new Error('Market analysis requires observations')
  }

  const closes = bars.map((bar) => bar.close)

  // Defensive checks keep this function safe when called
  // outside the validated CSV ingestion workflow.
  for (const close of closes) {
    if (!Number.isFinite(close) || close <= 0) {
      throw new Error('Market analysis requires positive finite closes')
    }
  }

  const dailyReturns: number[] = []

  for (let i = 1; i < closes.length; i++) {
    dailyReturns.push(
      closes[i] / closes[i - 1] - 1,
    )
  }

  const deviation = sampleStandardDeviation(dailyReturns)

  let peak = closes[0]
  let maximumDrawdown = 0

  for (const close of closes) {
    peak = Math.max(peak, close)
    const drawdown = (peak - close) / peak
    maximumDrawdown = Math.max(maximumDrawdown, drawdown)
  }

  return {
    observations: bars.length,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
    latestClose: closes[closes.length - 1],
    totalReturnPct: closes.length < 2
      ? null
      : (closes[closes.length - 1] / closes[0] - 1) * 100,
    annualizedVolatilityPct: deviation === null
      ? null
      : deviation * Math.sqrt(TRADING_DAYS) * 100,
    maximumDrawdownPct: maximumDrawdown * 100,
    sma20: simpleMovingAverage(closes, 20),
    sma50: simpleMovingAverage(closes, 50),
    rsi14: relativeStrengthIndex(closes),
  }
}
