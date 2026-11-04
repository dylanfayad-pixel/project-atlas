import { describe, expect, it } from 'vitest'
import { analyzeMarket } from './marketAnalytics'
import { classifyMarketRegime } from './marketRegime'
import type { OhlcvBar } from './ohlcvData'

// Generate reproducible observations without random inputs.
function barsFromCloses(closes: number[]): OhlcvBar[] {
  const start = Date.UTC(2025, 0, 1)

  return closes.map((close, index) => ({
    timestamp: new Date(start + index * 86400000)
      .toISOString().slice(0, 10),
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }))
}

describe('Historical market regime classification', () => {
  it('classifies a steadily rising market as bullish', () => {
    const closes = Array.from(
      { length: 80 },
      (_, index) => 100 + index,
    )

    const regime = classifyMarketRegime(
      analyzeMarket(barsFromCloses(closes)),
    )

    expect(regime.trend).toBe('bullish')
    expect(regime.volatility).toBe('normal')
  })

  it('classifies a steadily declining market as bearish', () => {
    const closes = Array.from(
      { length: 80 },
      (_, index) => 200 - index,
    )

    const regime = classifyMarketRegime(
      analyzeMarket(barsFromCloses(closes)),
    )

    expect(regime.trend).toBe('bearish')
  })

  it('classifies flat prices as sideways', () => {
    const regime = classifyMarketRegime(
      analyzeMarket(barsFromCloses(Array(80).fill(100))),
    )

    expect(regime.trend).toBe('sideways')
    expect(regime.volatility).toBe('normal')
  })

  it('identifies high historical volatility', () => {
    const closes = Array.from(
      { length: 80 },
      (_, index) => index % 2 === 0 ? 100 : 120,
    )

    const regime = classifyMarketRegime(
      analyzeMarket(barsFromCloses(closes)),
    )

    expect(regime.volatility).toBe('high')
  })

  it('does not classify insufficient observations', () => {
    const regime = classifyMarketRegime(
      analyzeMarket(barsFromCloses([100, 105, 110])),
    )

    expect(regime.trend).toBe('insufficient-data')
    expect(regime.volatility).toBe('insufficient-data')
  })

  it('provides reasons for classifications', () => {
    const regime = classifyMarketRegime(
      analyzeMarket(barsFromCloses(Array(80).fill(100))),
    )

    expect(regime.reasons.length).toBeGreaterThan(0)
  })
})
