import { describe, expect, it } from 'vitest'
import { analyzeMarket } from './marketAnalytics'
import { classifyMarketRegime } from './marketRegime'
import { generateResearchInsights } from './researchInsights'
import type { OhlcvBar } from './ohlcvData'

function barsFromCloses(closes: number[]): OhlcvBar[] {
  return closes.map((close, index) => ({
    timestamp: new Date(
      Date.UTC(2025, 0, index + 1),
    ).toISOString().slice(0, 10),
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }))
}

function insightsFor(closes: number[]) {
  const analysis = analyzeMarket(barsFromCloses(closes))
  const regime = classifyMarketRegime(analysis)

  return generateResearchInsights(analysis, regime)
}

describe('Automated historical research insights', () => {
  it('reports insufficient observations honestly', () => {
    const insights = insightsFor([100, 105])

    expect(insights.some(
      (insight) => insight.id === 'trend-insufficient',
    )).toBe(true)

    expect(insights.some(
      (insight) => insight.id === 'momentum-insufficient',
    )).toBe(true)
  })

  it('explains a bullish historical trend', () => {
    const insights = insightsFor(
      Array.from({ length: 80 }, (_, index) => 100 + index),
    )

    expect(insights.some(
      (insight) => insight.title === 'Bullish Historical Trend',
    )).toBe(true)
  })

  it('identifies elevated historical volatility', () => {
    const insights = insightsFor(
      Array.from(
        { length: 80 },
        (_, index) => index % 2 === 0 ? 100 : 120,
      ),
    )

    expect(insights.some(
      (insight) => insight.id === 'volatility-high',
    )).toBe(true)
  })

  it('identifies elevated RSI momentum', () => {
    const insights = insightsFor(
      Array.from({ length: 80 }, (_, index) => 100 + index),
    )

    expect(insights.some(
      (insight) => insight.title === 'Elevated RSI Momentum',
    )).toBe(true)
  })

  it('produces stable unique insight identifiers', () => {
    const insights = insightsFor(Array(80).fill(100))
    const ids = insights.map((insight) => insight.id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})
