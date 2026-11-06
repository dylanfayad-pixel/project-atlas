import { useMemo, useState } from 'react'
import { analyzeAlignedRisk } from '../lib/alignedRiskAnalytics'
import { assessComparisonQuality } from '../lib/comparisonQuality'
import { InstrumentScreeningControls } from './InstrumentScreeningControls'
import {
  DEFAULT_SCREENING_FILTERS,
  screenInstruments,
} from '../lib/instrumentScreening'
import type {
  ScreeningDirection,
  ScreeningFilters,
  ScreeningSort,
} from '../lib/instrumentScreening'
import type { ResearchDataset } from '../lib/researchSession'

type Props = {
  datasets: ResearchDataset[]
}

function formatPercent(value: number | null): string {
  return value === null ? 'Unavailable' : `${value.toFixed(2)}%`
}

// Display only descriptive, date-aligned historical comparisons.
export function InstrumentComparison({ datasets }: Props) {
  const [filters, setFilters] = useState<ScreeningFilters>(
    DEFAULT_SCREENING_FILTERS,
  )
  const [sort, setSort] = useState<ScreeningSort>('return')
  const [direction, setDirection] =
    useState<ScreeningDirection>('desc')

  const analysis = useMemo(
    () => analyzeAlignedRisk(datasets),
    [datasets],
  )

  const quality = useMemo(
    () => assessComparisonQuality(datasets),
    [datasets],
  )

  const screened = useMemo(
    () => screenInstruments(
      analysis.results,
      quality.eligibility,
      filters,
      sort,
      direction,
    ),
    [analysis.results, quality.eligibility, filters, sort, direction],
  )

  function resetScreening() {
    setFilters(DEFAULT_SCREENING_FILTERS)
    setSort('return')
    setDirection('desc')
  }

  return (
    <>
      <InstrumentScreeningControls
        filters={filters}
        sort={sort}
        direction={direction}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onDirectionChange={setDirection}
        onReset={resetScreening}
      />

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

          {screened.length === 0 && (
            <p className="workspace-description" role="status">
              No instruments match the current screening filters.
              Adjust or reset the filters to see results.
            </p>
          )}

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Instrument</th>
                  <th>Return</th>
                  <th>Volatility</th>
                  <th>Max Drawdown</th>
                  <th>Observations</th>
                </tr>
              </thead>
              <tbody>
                {screened.map((result) => (
                  <tr key={result.datasetId}>
                    <td>{result.rank ?? '—'}</td>
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
    </>
  )
}
