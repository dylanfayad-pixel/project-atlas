import { describe, expect, it } from 'vitest'
import { compareHistoricalReturns } from './comparativeAnalytics'
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

describe('Aligned historical comparative analytics', () => {
  it('matches the unified aligned-risk return calculation', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 110],
      ['2026-01-07', 120],
    ])

    const second = dataset('b', [
      ['2026-01-05', 200],
      ['2026-01-07', 220],
    ])

    const datasets = [first, second]

    const comparison = compareHistoricalReturns(datasets)
    const risk = analyzeAlignedRisk(datasets)

    expect(comparison.results).toHaveLength(risk.results.length)

    for (let index = 0; index < comparison.results.length; index++) {
      expect(comparison.results[index].returnPct)
        .toBeCloseTo(risk.results[index].returnPct, 12)
    }
  })

  it('requires at least two instruments', () => {
    const result = compareHistoricalReturns([])

    expect(result.results).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
  })

  it('compares returns over identical dates', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 110],
    ])

    const second = dataset('b', [
      ['2026-01-05', 200],
      ['2026-01-06', 210],
    ])

    const result = compareHistoricalReturns([first, second])

    expect(result.startDate).toBe('2026-01-05')
    expect(result.endDate).toBe('2026-01-06')
    expect(result.results[0].returnPct).toBeCloseTo(10)
    expect(result.results[1].returnPct).toBeCloseTo(5)
  })

  it('uses only shared calendar endpoints', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 110],
      ['2026-01-07', 120],
    ])

    const second = dataset('b', [
      ['2026-01-06', 200],
      ['2026-01-07', 220],
      ['2026-01-08', 240],
    ])

    const result = compareHistoricalReturns([first, second])

    expect(result.startDate).toBe('2026-01-06')
    expect(result.endDate).toBe('2026-01-07')
    expect(result.results[0].returnPct).toBeCloseTo(
      (120 / 110 - 1) * 100,
    )
    expect(result.results[1].returnPct).toBeCloseTo(10)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('rejects comparisons with insufficient shared dates', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 110],
    ])

    const second = dataset('b', [
      ['2026-01-06', 200],
      ['2026-01-07', 210],
    ])

    const result = compareHistoricalReturns([first, second])

    expect(result.results).toHaveLength(0)
    expect(result.startDate).toBeNull()
  })

  it('does not fabricate observations for missing dates', () => {
    const first = dataset('a', [
      ['2026-01-05', 100],
      ['2026-01-06', 105],
      ['2026-01-07', 110],
    ])

    const second = dataset('b', [
      ['2026-01-05', 200],
      ['2026-01-07', 220],
    ])

    const result = compareHistoricalReturns([first, second])

    expect(result.results[0].returnPct).toBeCloseTo(10)
    expect(result.results[1].returnPct).toBeCloseTo(10)
    expect(result.warnings.some(
      (warning) => warning.includes('outside the shared'),
    )).toBe(true)
  })
})
