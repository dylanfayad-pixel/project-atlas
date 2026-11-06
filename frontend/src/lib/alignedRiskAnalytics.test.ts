import { describe, expect, it } from 'vitest'
import { analyzeAlignedRisk } from './alignedRiskAnalytics'
import type { ResearchDataset } from './researchSession'

function dataset(
  id: string,
  observations: Array<[string, number]>,
): ResearchDataset {
  const bars = observations.map(([timestamp, close]) => ({
    timestamp,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }))

  return {
    id,
    source: 'uploaded-csv',
    filename: `${id}.csv`,
    symbol: id.toUpperCase(),
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}

describe('Aligned multi-instrument risk analytics', () => {
  it('requires at least two datasets', () => {
    const result = analyzeAlignedRisk([])

    expect(result.results).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
  })

  it('calculates aligned returns and drawdown', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 120],
      ['2026-01-07', 90],
    ])

    const second = dataset('b', [
      ['2026-01-05', 200],
      ['2026-01-06', 210],
      ['2026-01-07', 220],
    ])

    const result = analyzeAlignedRisk([first, second])

    expect(result.results[0].returnPct).toBeCloseTo(-10)
    expect(result.results[0].maximumDrawdownPct).toBeCloseTo(25)

    expect(result.results[1].returnPct).toBeCloseTo(10)
    expect(result.results[1].maximumDrawdownPct).toBeCloseTo(0)
  })

  it('calculates zero volatility for constant prices', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 100],
      ['2026-01-07', 100],
    ])

    const second = dataset('b', [
      ['2026-01-05', 200],
      ['2026-01-06', 200],
      ['2026-01-07', 200],
    ])

    const result = analyzeAlignedRisk([first, second])

    expect(result.results[0].annualizedVolatilityPct).toBe(0)
    expect(result.results[1].annualizedVolatilityPct).toBe(0)
  })

  it('does not calculate volatility from one return', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 110],
    ])

    const second = dataset('b', [
      ['2026-01-05', 200],
      ['2026-01-06', 210],
    ])

    const result = analyzeAlignedRisk([first, second])

    expect(result.results[0].annualizedVolatilityPct).toBeNull()
    expect(result.warnings.some(
      (warning) => warning.includes('three shared'),
    )).toBe(true)
  })

  it('suppresses volatility when shared-date coverage has gaps', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 102],
      ['2026-01-07', 104],
      ['2026-01-08', 106],
    ])

    const second = dataset('b', [
      ['2026-01-05', 200],
      ['2026-01-07', 210],
      ['2026-01-08', 215],
    ])

    const result = analyzeAlignedRisk([first, second])

    expect(result.results[0].annualizedVolatilityPct)
      .toBeNull()

    expect(result.results[1].annualizedVolatilityPct)
      .toBeNull()

    expect(result.warnings.some(
      (warning) => warning.includes('coverage gaps'),
    )).toBe(true)

    // Total return remains valid over shared endpoints.
    expect(result.results[0].returnPct).toBeCloseTo(6)
    expect(result.results[1].returnPct).toBeCloseTo(7.5)
  })

  it('excludes dates unavailable to another instrument', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 110],
      ['2026-01-07', 120],
      ['2026-01-08', 130],
    ])

    const second = dataset('b', [
      ['2026-01-05', 200],
      ['2026-01-07', 220],
      ['2026-01-08', 240],
    ])

    const result = analyzeAlignedRisk([first, second])

    expect(result.sharedDates).toEqual([
      '2026-01-05',
      '2026-01-07',
      '2026-01-08',
    ])

    expect(result.results[0].observations).toBe(3)
    expect(result.results[1].observations).toBe(3)
    expect(result.warnings.length).toBeGreaterThan(1)
  })
})
