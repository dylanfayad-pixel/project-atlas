import { describe, expect, it } from 'vitest'
import {
  addResearchDataset,
  createResearchCollection,
  getActiveDataset,
  removeResearchDataset,
  replaceResearchDataset,
  selectResearchDataset,
} from './researchCollection'
import type { ResearchDataset } from './researchSession'

function dataset(id: string): ResearchDataset {
  return {
    id,
    source: 'uploaded-csv',
    filename: `${id}.csv`,
    symbol: null,
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars: [{
      timestamp: '2026-01-05',
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 1000,
    }],
    firstTimestamp: '2026-01-05',
    lastTimestamp: '2026-01-05',
  }
}

describe('Multi-instrument research collection', () => {
  it('starts empty without fabricated datasets', () => {
    const collection = createResearchCollection()

    expect(collection.datasets).toEqual([])
    expect(getActiveDataset(collection)).toBeNull()
  })

  it('adds datasets without mutating previous state', () => {
    const initial = createResearchCollection()
    const next = addResearchDataset(initial, dataset('a'))

    expect(initial.datasets).toHaveLength(0)
    expect(next.datasets).toHaveLength(1)
    expect(getActiveDataset(next)?.id).toBe('a')
  })

  it('supports selecting an existing dataset', () => {
    const first = addResearchDataset(
      createResearchCollection(),
      dataset('a'),
    )
    const second = addResearchDataset(first, dataset('b'))

    const selected = selectResearchDataset(second, 'a')

    expect(getActiveDataset(selected)?.id).toBe('a')
    expect(second.activeDatasetId).toBe('b')
  })

  it('rejects duplicate dataset IDs', () => {
    const collection = addResearchDataset(
      createResearchCollection(),
      dataset('a'),
    )

    expect(() => addResearchDataset(
      collection,
      dataset('a'),
    )).toThrow()
  })

  it('rejects selecting unknown datasets', () => {
    expect(() => selectResearchDataset(
      createResearchCollection(),
      'missing',
    )).toThrow()
  })

  it('replaces one dataset without modifying others', () => {
    const first = addResearchDataset(
      createResearchCollection(),
      dataset('a'),
    )
    const second = addResearchDataset(first, dataset('b'))

    const replacement = {
      ...dataset('a'),
      filename: 'updated.csv',
    }

    const updated = replaceResearchDataset(
      second,
      'a',
      replacement,
    )

    expect(updated.datasets[0].filename).toBe('updated.csv')
    expect(updated.datasets[1]).toBe(second.datasets[1])
  })

  it('removes an active dataset and selects a remaining one', () => {
    const first = addResearchDataset(
      createResearchCollection(),
      dataset('a'),
    )
    const second = addResearchDataset(first, dataset('b'))

    const updated = removeResearchDataset(second, 'b')

    expect(updated.datasets).toHaveLength(1)
    expect(updated.activeDatasetId).toBe('a')
  })

  it('clears selection after removing the last dataset', () => {
    const collection = addResearchDataset(
      createResearchCollection(),
      dataset('a'),
    )

    const updated = removeResearchDataset(collection, 'a')

    expect(getActiveDataset(updated)).toBeNull()
    expect(updated.activeDatasetId).toBeNull()
  })

  it('preserves active selection when replacing an inactive dataset', () => {
    const first = addResearchDataset(
      createResearchCollection(),
      dataset('a'),
    )

    const second = addResearchDataset(first, dataset('b'))

    const updated = replaceResearchDataset(
      second,
      'a',
      dataset('c'),
    )

    expect(updated.activeDatasetId).toBe('b')
    expect(getActiveDataset(updated)?.id).toBe('b')
    expect(updated.datasets.map((item) => item.id))
      .toEqual(['c', 'b'])
  })

  it('rejects replacement IDs already owned by another dataset', () => {
    const first = addResearchDataset(
      createResearchCollection(),
      dataset('a'),
    )

    const second = addResearchDataset(first, dataset('b'))

    expect(() => replaceResearchDataset(
      second,
      'a',
      dataset('b'),
    )).toThrow('Replacement dataset ID already exists')
  })

  it('preserves independent instrument metadata', () => {
    const apple = {
      ...dataset('a'),
      symbol: 'AAPL',
      exchange: 'NASDAQ',
    }

    const microsoft = {
      ...dataset('b'),
      symbol: 'MSFT',
      exchange: 'NASDAQ',
    }

    const first = addResearchDataset(
      createResearchCollection(),
      apple,
    )

    const second = addResearchDataset(first, microsoft)

    const updated = replaceResearchDataset(
      second,
      'a',
      {
        ...apple,
        exchange: 'NYSE',
      },
    )

    expect(updated.datasets[0].exchange).toBe('NYSE')
    expect(updated.datasets[1].symbol).toBe('MSFT')
    expect(updated.datasets[1].exchange).toBe('NASDAQ')
  })

  it('rejects empty dataset identifiers', () => {
    expect(() => addResearchDataset(
      createResearchCollection(),
      dataset(''),
    )).toThrow('Invalid dataset ID')
  })

  it('rejects identifiers with surrounding whitespace', () => {
    expect(() => addResearchDataset(
      createResearchCollection(),
      dataset(' invalid '),
    )).toThrow('Invalid dataset ID')
  })

  it('rejects invalid replacement identifiers', () => {
    const collection = addResearchDataset(
      createResearchCollection(),
      dataset('valid'),
    )

    expect(() => replaceResearchDataset(
      collection,
      'valid',
      dataset(''),
    )).toThrow('Invalid dataset ID')
  })

  it('rejects collection capacity overflow', () => {
    let collection = createResearchCollection()

    for (let i = 0; i < 20; i++) {
      collection = addResearchDataset(
        collection,
        dataset(`instrument-${i}`),
      )
    }

    expect(() => addResearchDataset(
      collection,
      dataset('overflow'),
    )).toThrow('Research collection capacity exceeded')
  })
})
