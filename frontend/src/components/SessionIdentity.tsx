import type { ResearchDataset } from '../lib/researchSession'

type Props = {
  dataset: ResearchDataset
}

// Keep instrument identity and data provenance visible
// wherever a user examines research-session information.
export function SessionIdentity({ dataset }: Props) {
  const symbol = dataset.symbol ?? 'UNSPECIFIED INSTRUMENT'
  const exchange = dataset.exchange ?? 'Exchange not specified'

  return (
    <section
      className="session-identity"
      aria-label="Active research dataset"
    >
      <div className="session-identity-main">
        <div>
          <span className="session-identity-label">
            ACTIVE INSTRUMENT
          </span>
          <strong>{symbol}</strong>
          <p>{exchange}</p>
        </div>

        <span className="session-identity-source">
          USER-UPLOADED DATA
        </span>
      </div>

      <div className="session-identity-details">
        <div>
          <span>TIMEFRAME</span>
          <strong>1 Day / Candle</strong>
        </div>
        <div>
          <span>HISTORICAL PERIOD</span>
          <strong>
            {dataset.firstTimestamp} — {dataset.lastTimestamp}
          </strong>
        </div>
        <div>
          <span>OBSERVATIONS</span>
          <strong>{dataset.bars.length.toLocaleString()}</strong>
        </div>
      </div>

      <p className="session-identity-disclaimer">
        Instrument labels are user-provided and unverified.
        Historical market prices have not been independently
        authenticated.
      </p>
    </section>
  )
}
