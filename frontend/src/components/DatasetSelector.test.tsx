// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatasetSelector } from './DatasetSelector'
import type { ResearchCollection } from '../lib/researchCollection'

afterEach(() => cleanup())

const collection: ResearchCollection = {
  activeDatasetId: 'a',
  datasets: [
    {
      id: 'a',
      source: 'uploaded-csv',
      filename: 'apple.csv',
      symbol: 'AAPL',
      exchange: 'NASDAQ',
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
    },
    {
      id: 'b',
      source: 'uploaded-csv',
      filename: 'microsoft.csv',
      symbol: 'MSFT',
      exchange: 'NASDAQ',
      instrumentVerified: false,
      timeframe: '1d',
      bars: [{
        timestamp: '2026-01-05',
        open: 200,
        high: 200,
        low: 200,
        close: 200,
        volume: 1000,
      }],
      firstTimestamp: '2026-01-05',
      lastTimestamp: '2026-01-05',
    },
  ],
}

describe('Research dataset selector', () => {
  it('does not render an empty collection', () => {
    const { container } = render(
      <DatasetSelector
        collection={{ datasets: [], activeDatasetId: null }}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('displays independent instrument identities', () => {
    render(
      <DatasetSelector
        collection={collection}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('MSFT')).toBeInTheDocument()
    expect(screen.getByText('2 DATASETS')).toBeInTheDocument()
  })

  it('selects another instrument', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <DatasetSelector
        collection={collection}
        onSelect={onSelect}
        onRemove={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', {
      name: 'Select Dataset',
    }))

    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('removes a selected instrument by identity', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <DatasetSelector
        collection={collection}
        onSelect={vi.fn()}
        onRemove={onRemove}
      />,
    )

    await user.click(screen.getByRole('button', {
      name: 'Remove AAPL',
    }))

    expect(onRemove).toHaveBeenCalledWith('a')
  })
})
