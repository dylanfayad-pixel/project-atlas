import { describe, expect, it } from 'vitest'
import { parseOhlcvCsv } from './ohlcvData'
import {
  createResearchSession,
  createUploadedDataset,
  DEFAULT_STRATEGY,
} from './researchSession'

const sample = [
  'timestamp,open,high,low,close,volume',
  '2026-01-05,100,105,98,103,1500000',
  '2026-01-06,103,108,101,106,1700000',
].join('\n')

describe('Research session state', () => {
  it('starts without an active dataset', () => {
    const session = createResearchSession()

    expect(session.dataset).toBeNull()
    expect(session.status).toBe('no-data')
  })

  it('starts with the default strategy configuration', () => {
    const session = createResearchSession()

    expect(session.strategy).toEqual(DEFAULT_STRATEGY)
    expect(session.strategy.fastWindow).toBe(20)
    expect(session.strategy.slowWindow).toBe(50)
  })

  it('creates independent strategy settings', () => {
    const first = createResearchSession()
    const second = createResearchSession()

    first.strategy.fastWindow = 10

    expect(second.strategy.fastWindow).toBe(20)
    expect(DEFAULT_STRATEGY.fastWindow).toBe(20)
  })

  it('creates an uploaded dataset with correct metadata', () => {
    const bars = parseOhlcvCsv(sample)
    const dataset = createUploadedDataset('sample.csv', bars)

    expect(dataset.source).toBe('uploaded-csv')
    expect(dataset.filename).toBe('sample.csv')
    expect(dataset.symbol).toBeNull()
    expect(dataset.timeframe).toBe('1d')
    expect(dataset.bars).toHaveLength(2)
    expect(dataset.firstTimestamp).toBe('2026-01-05')
    expect(dataset.lastTimestamp).toBe('2026-01-06')
  })

  it('assigns unique IDs to separate imports', () => {
    const bars = parseOhlcvCsv(sample)

    const first = createUploadedDataset('sample.csv', bars)
    const second = createUploadedDataset('sample.csv', bars)

    expect(first.id).not.toBe(second.id)
  })

  it('rejects an empty dataset', () => {
    expect(() => createUploadedDataset('empty.csv', []))
      .toThrow('Cannot create a dataset without observations')
  })

  it('does not create synthetic performance results', () => {
    const session = createResearchSession()

    expect(session).not.toHaveProperty('portfolio')
    expect(session).not.toHaveProperty('trades')
    expect(session).not.toHaveProperty('performance')
  })
})
