import type { ResearchDataset } from '../lib/researchSession'

// Display recorded provider metadata without inferring missing values.
export function DataProvenancePanel({
  dataset,
}: {
  dataset: ResearchDataset
}) {
  if (dataset.source !== 'provider' || !dataset.provenance) {
    return null
  }

  const provenance = dataset.provenance

  return (
    <section className="panel" aria-label="Data Provenance">
      <div className="panel-heading">
        <div>
          <h2>Data Provenance</h2>
          <p>Recorded source information for this research dataset.</p>
        </div>
        <span className="panel-tag">PROVIDER DATA</span>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <span>Provider</span>
          <strong>{provenance.provider}</strong>
        </div>

        <div className="detail-card">
          <span>Retrieved At</span>
          <strong>{provenance.retrievedAt}</strong>
        </div>

        <div className="detail-card">
          <span>Price Adjustment</span>
          <strong>
            {provenance.adjusted ? 'Adjusted' : 'Unadjusted'}
          </strong>
        </div>

        <div className="detail-card">
          <span>Requested Date Range</span>
          <strong>
            {provenance.requestedStartDate}
            {' — '}
            {provenance.requestedEndDate}
          </strong>
        </div>
      </div>

      <p className="workspace-description">
        Provider attribution records the reported source, not an
        independent verification of instrument identity. Historical
        price returns may exclude dividends and other adjustments.
      </p>
    </section>
  )
}
