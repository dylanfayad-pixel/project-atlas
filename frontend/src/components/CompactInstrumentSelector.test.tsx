// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CompactInstrumentSelector } from './CompactInstrumentSelector'
import {
  addResearchDataset,
  createResearchCollection,
  selectResearchDataset,
} from '../lib/researchCollection'
import type { ResearchDataset } from '../lib/researchSession'

function dataset(id: string, filename: string): ResearchDataset {
  return {
    id,
    filename,
    source: 'uploaded-csv',
    timeframe: '1d',
    symbol: null,
    exchange: null,
    instrumentVerified: false,
    firstTimestamp: '2026-01-05',
    lastTimestamp: '2026-01-06',
    bars: [
      {
        timestamp: '2026-01-05',
        open: 100,
        high: 105,
        low: 95,
        close: 101,
        volume: 1000,
      },
      {
        timestamp: '2026-01-06',
        open: 101,
        high: 106,
        low: 100,
        close: 104,
        volume: 1200,
      },
    ],
  }
}

afterEach(() => {
  cleanup()
})

describe('Compact instrument selector', () => {
  it('does not render when no datasets exist', () => {
    const { container } = render(
      <CompactInstrumentSelector
        collection={createResearchCollection()}
        onSelect={vi.fn()}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('displays the active instrument and collection count', () => {
    const collection = addResearchDataset(
      createResearchCollection(),
      dataset('a', 'alpha.csv'),
    )

    render(
      <CompactInstrumentSelector
        collection={collection}
        onSelect={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('combobox', { name: 'Active Instrument' }),
    ).toHaveValue('a')

    expect(screen.getByText('1 instrument')).toBeInTheDocument()
  })

  it('switches instruments using their stable IDs', () => {
    let collection = createResearchCollection()

    collection = addResearchDataset(
      collection,
      dataset('a', 'alpha.csv'),
    )

    collection = addResearchDataset(
      collection,
      dataset('b', 'beta.csv'),
    )

    collection = selectResearchDataset(collection, 'a')

    const onSelect = vi.fn()

    render(
      <CompactInstrumentSelector
        collection={collection}
        onSelect={onSelect}
      />,
    )

    fireEvent.change(
      screen.getByRole('combobox', { name: 'Active Instrument' }),
      { target: { value: 'b' } },
    )

    expect(onSelect).toHaveBeenCalledWith('b')
    expect(screen.getByText('2 instruments')).toBeInTheDocument()
  })
})
