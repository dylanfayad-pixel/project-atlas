import type { ResearchCollection } from '../lib/researchCollection'

type Props = {
  collection: ResearchCollection
  onSelect: (datasetId: string) => void
  onRemove: (datasetId: string) => void
}

// The selector displays dataset identity and provenance.
// User-provided symbols are labels, not verified market data.
export function DatasetSelector({
  collection,
  onSelect,
  onRemove,
}: Props) {
  if (collection.datasets.length === 0) {
    return null
  }

  return (
    <section className="panel" aria-label="Research Collection">
      <div className="panel-heading">
        <div>
          <h2>Research Collection</h2>
          <p>
            Select an instrument to inspect its historical data.
          </p>
        </div>
        <span className="panel-tag">
          {collection.datasets.length} DATASETS
        </span>
      </div>

      <div className="detail-grid">
        {collection.datasets.map((dataset) => {
          const selected =
            dataset.id === collection.activeDatasetId

          return (
            <article className="detail-card" key={dataset.id}>
              <span>
                {dataset.source === 'manual-entry'
                  ? 'MANUAL DATA'
                  : 'IMPORTED DATA'}
              </span>

              <strong>
                {dataset.symbol ??
                  dataset.filename ??
                  'Unlabeled Dataset'}
              </strong>

              <p>
                {dataset.bars.length} observations
                {' · '}
                {dataset.firstTimestamp}
                {' — '}
                {dataset.lastTimestamp}
              </p>

              <button
                type="button"
                className="research-upload-button"
                aria-pressed={selected}
                onClick={() => onSelect(dataset.id)}
              >
                {selected ? 'Selected Dataset' : 'Select Dataset'}
              </button>

              <button
                type="button"
                className="research-upload-button"
                aria-label={
                  `Remove ${dataset.symbol ??
                    dataset.filename ??
                    'dataset'}`
                }
                onClick={() => onRemove(dataset.id)}
              >
                Remove
              </button>
            </article>
          )
        })}
      </div>

      <p className="workspace-description">
        Dataset labels are user-provided and unverified.
        Selecting an instrument changes the active research
        context without modifying its observations.
      </p>
    </section>
  )
}
