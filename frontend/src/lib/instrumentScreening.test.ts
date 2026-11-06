import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCREENING_FILTERS,
  screenInstruments,
} from './instrumentScreening'
import type { AlignedRiskResult } from './alignedRiskAnalytics'

const results: AlignedRiskResult[] = [
  {
    datasetId: 'a',
    label: 'AAPL',
    observations: 60,
    returnPct: 12,
    annualizedVolatilityPct: 20,
    maximumDrawdownPct: 8,
  },
  {
    datasetId: 'b',
    label: 'MSFT',
    observations: 60,
    returnPct: 8,
    annualizedVolatilityPct: 15,
    maximumDrawdownPct: 5,
  },
  {
    datasetId: 'c',
    label: 'NVDA',
    observations: 60,
    returnPct: 25,
    annualizedVolatilityPct: null,
    maximumDrawdownPct: 18,
  },
]

describe('Historical instrument screening', () => {
  it('sorts historical returns in descending order', () => {
    const screened = screenInstruments(
      results,
      'eligible',
      DEFAULT_SCREENING_FILTERS,
    )

    expect(screened.map((item) => item.label))
      .toEqual(['NVDA', 'AAPL', 'MSFT'])
    expect(screened.map((item) => item.rank))
      .toEqual([1, 2, 3])
  })

  it('filters by instrument name without case sensitivity', () => {
    const screened = screenInstruments(
      results,
      'eligible',
      {
        ...DEFAULT_SCREENING_FILTERS,
        search: 'aap',
      },
    )

    expect(screened.map((item) => item.label))
      .toEqual(['AAPL'])
  })

  it('filters by minimum historical return', () => {
    const screened = screenInstruments(
      results,
      'eligible',
      {
        ...DEFAULT_SCREENING_FILTERS,
        minimumReturnPct: 10,
      },
    )

    expect(screened.map((item) => item.label))
      .toEqual(['NVDA', 'AAPL'])
  })

  it('filters by maximum drawdown', () => {
    const screened = screenInstruments(
      results,
      'eligible',
      {
        ...DEFAULT_SCREENING_FILTERS,
        maximumDrawdownPct: 8,
      },
    )

    expect(screened.map((item) => item.label))
      .toEqual(['AAPL', 'MSFT'])
  })

  it('excludes unavailable volatility under a volatility filter', () => {
    const screened = screenInstruments(
      results,
      'eligible',
      {
        ...DEFAULT_SCREENING_FILTERS,
        maximumVolatilityPct: 20,
      },
    )

    expect(screened.map((item) => item.label))
      .toEqual(['AAPL', 'MSFT'])
  })

  it('sorts missing volatility last', () => {
    const screened = screenInstruments(
      results,
      'eligible',
      DEFAULT_SCREENING_FILTERS,
      'volatility',
      'asc',
    )

    expect(screened.map((item) => item.label))
      .toEqual(['MSFT', 'AAPL', 'NVDA'])
  })

  it('does not rank limited comparisons', () => {
    const screened = screenInstruments(
      results,
      'limited',
      DEFAULT_SCREENING_FILTERS,
    )

    expect(screened.every((item) => item.rank === null))
      .toBe(true)
  })

  it('does not rank ineligible comparisons', () => {
    const screened = screenInstruments(
      results,
      'ineligible',
      DEFAULT_SCREENING_FILTERS,
    )

    expect(screened.every((item) => item.rank === null))
      .toBe(true)
  })

  it('preserves original ranks after filtering', () => {
    const screened = screenInstruments(
      results,
      'eligible',
      {
        ...DEFAULT_SCREENING_FILTERS,
        search: 'MSFT',
      },
    )

    expect(screened).toHaveLength(1)
    expect(screened[0].rank).toBe(3)
  })

  it('preserves historical-return ranks when sorting by name', () => {
    const screened = screenInstruments(
      results,
      'eligible',
      DEFAULT_SCREENING_FILTERS,
      'name',
      'asc',
    )

    expect(screened.map((item) => item.label))
      .toEqual(['AAPL', 'MSFT', 'NVDA'])

    expect(screened.map((item) => item.rank))
      .toEqual([2, 3, 1])
  })

  it('does not mutate the original results', () => {
    const original = results.map((item) => item.datasetId)

    screenInstruments(
      results,
      'eligible',
      DEFAULT_SCREENING_FILTERS,
    )

    expect(results.map((item) => item.datasetId))
      .toEqual(original)
  })

  it('uses deterministic dataset IDs to resolve ties', () => {
    const tied = [
      { ...results[0], returnPct: 10 },
      { ...results[1], returnPct: 10 },
    ]

    const screened = screenInstruments(
      tied,
      'eligible',
      DEFAULT_SCREENING_FILTERS,
    )

    expect(screened.map((item) => item.datasetId))
      .toEqual(['a', 'b'])
  })
})
