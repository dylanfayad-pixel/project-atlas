import { useMemo } from 'react'
import { analyzeAlignedRisk } from '../lib/alignedRiskAnalytics'
import { assessComparisonQuality } from '../lib/comparisonQuality'
import type { ResearchDataset } from '../lib/researchSession'

type Props = {
  datasets: ResearchDataset[]
}

function formatPercent(value: number | null): string {
  return value === null ? 'Unavailable' : `${value.toFixed(2)}%`
}

// Display only descriptive, date-aligned historical comparisons.
export function InstrumentComparison({ datasets }: Props) {
  const analysis = useMemo(
    () => analyzeAlignedRisk(datasets),
    [datasets],
  )

  const quality = useMemo(
    () => assessComparisonQuality(datasets),
    [datasets],
  )

  return (
    <section className="panel" aria-label="Instrument Comparison">
      <div className="panel-heading">
        <div>
          <h2>Multi-Instrument Comparison</h2>
          <p>
            Historical measurements aligned to common
            observation dates.
          </p>
        </div>
        <span className="panel-tag">
          {quality.eligibility.toUpperCase()}
        </span>
      </div>

      {analysis.results.length === 0 ? (
        <p className="workspace-description">
          At least two instruments with two shared
          observation dates are required.
        </p>
      ) : (
        <>
          <div className="detail-grid">
            <div className="detail-card">
              <span>Shared Observations</span>
              <strong>{quality.sharedObservations}</strong>
            </div>

            <div className="detail-card">
              <span>Date Coverage</span>
              <strong>{formatPercent(quality.coveragePct)}</strong>
            </div>

            <div className="detail-card">
              <span>Comparison Start</span>
              <strong>{quality.sharedStartDate}</strong>
            </div>

            <div className="detail-card">
              <span>Comparison End</span>
              <strong>{quality.sharedEndDate}</strong>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Return</th>
                  <th>Volatility</th>
                  <th>Max Drawdown</th>
                  <th>Observations</th>
                </tr>
              </thead>
              <tbody>
                {analysis.results.map((result) => (
                  <tr key={result.datasetId}>
                    <td>{result.label}</td>
                    <td>{formatPercent(result.returnPct)}</td>
                    <td>
                      {formatPercent(result.annualizedVolatilityPct)}
                    </td>
                    <td>
                      {formatPercent(result.maximumDrawdownPct)}
                    </td>
                    <td>{result.observations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="workspace-description">
        <strong>Comparison Quality</strong>
        <ul>
          {quality.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>

      <p className="workspace-description">
        Historical comparisons do not establish future
        performance. Instrument identities are user-provided
        and unverified. No trading recommendations are generated.
      </p>
    </section>
  )
}
