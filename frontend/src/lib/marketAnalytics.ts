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
  ema12: number | null
  ema26: number | null
  macd: MacdResult
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

// Calculate the latest EMA using an initial SMA seed.
// Returns null until enough observations are available.
export function exponentialMovingAverage(
  values: number[],
  period: number,
): number | null {
  if (
    !Number.isSafeInteger(period) ||
    period < 1 ||
    values.length < period
  ) {
    return null
  }

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('EMA requires finite observations')
  }

  const multiplier = 2 / (period + 1)
  let ema = mean(values.slice(0, period))

  for (let i = period; i < values.length; i++) {
    ema = values[i] * multiplier + ema * (1 - multiplier)
  }

  return ema
}

export type MacdResult = {
  macd: number | null
  signal: number | null
  histogram: number | null
}

// Calculate MACD using independently seeded fast and slow
// EMAs, then seed the signal EMA from valid MACD values.
export function movingAverageConvergenceDivergence(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MacdResult {
  if (
    !Number.isSafeInteger(fastPeriod) ||
    !Number.isSafeInteger(slowPeriod) ||
    !Number.isSafeInteger(signalPeriod) ||
    fastPeriod < 1 ||
    slowPeriod <= fastPeriod ||
    signalPeriod < 1
  ) {
    throw new Error('Invalid MACD periods')
  }

  if (closes.some((value) => !Number.isFinite(value))) {
    throw new Error('MACD requires finite observations')
  }

  if (closes.length < slowPeriod) {
    return { macd: null, signal: null, histogram: null }
  }

  const fastMultiplier = 2 / (fastPeriod + 1)
  const slowMultiplier = 2 / (slowPeriod + 1)
  const signalMultiplier = 2 / (signalPeriod + 1)

  // Seed each EMA from its initial SMA.
  let fastSum = 0
  let slowSum = 0
  let fastEma = 0
  let slowEma = 0

  let macd = 0
  let signal = 0
  let signalSeedSum = 0
  let macdObservations = 0

  for (let i = 0; i < closes.length; i++) {
    const close = closes[i]

    if (i < fastPeriod) {
      fastSum += close
      if (i === fastPeriod - 1) {
        fastEma = fastSum / fastPeriod
      }
    } else {
      fastEma =
        close * fastMultiplier +
        fastEma * (1 - fastMultiplier)
    }

    if (i < slowPeriod) {
      slowSum += close
      if (i === slowPeriod - 1) {
        slowEma = slowSum / slowPeriod
      }
    } else {
      slowEma =
        close * slowMultiplier +
        slowEma * (1 - slowMultiplier)
    }

    if (i < slowPeriod - 1) continue

    macd = fastEma - slowEma
    macdObservations++

    // The signal EMA is seeded from the first
    // signalPeriod valid MACD observations.
    if (macdObservations <= signalPeriod) {
      signalSeedSum += macd

      if (macdObservations === signalPeriod) {
        signal = signalSeedSum / signalPeriod
      }
    } else {
      signal =
        macd * signalMultiplier +
        signal * (1 - signalMultiplier)
    }
  }

  if (macdObservations < signalPeriod) {
    return {
      macd,
      signal: null,
      histogram: null,
    }
  }

  return {
    macd,
    signal,
    histogram: macd - signal,
  }
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
    ema12: exponentialMovingAverage(closes, 12),
    ema26: exponentialMovingAverage(closes, 26),
    macd: movingAverageConvergenceDivergence(closes),
    rsi14: relativeStrengthIndex(closes),
  }
}
