import { useId } from 'react'
import type { ResearchCollection } from '../lib/researchCollection'

// A compact instrument switcher for the Market Overview header.
// Dataset removal remains available in the full research collection.
type Props = {
  collection: ResearchCollection
  onSelect: (datasetId: string) => void
}

export function CompactInstrumentSelector({
  collection,
  onSelect,
}: Props) {
  const instrumentId = useId()

  if (collection.datasets.length === 0) return null

  const selectedId = collection.activeDatasetId ?? ''

  return (
    <div className="compact-instrument-selector">
      <label htmlFor={instrumentId}>
        Active Instrument
      </label>

      <select
        id={instrumentId}
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
      >
        {collection.datasets.map((dataset) => (
          <option key={dataset.id} value={dataset.id}>
            {dataset.symbol ??
              dataset.filename ??
              'Unlabeled Dataset'}
          </option>
        ))}
      </select>

      <span>
        {collection.datasets.length} instrument
        {collection.datasets.length === 1 ? '' : 's'}
      </span>
    </div>
  )
}
