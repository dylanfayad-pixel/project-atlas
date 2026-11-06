import type {
  ScreeningDirection,
  ScreeningFilters,
  ScreeningSort,
} from '../lib/instrumentScreening'

type Props = {
  filters: ScreeningFilters
  sort: ScreeningSort
  direction: ScreeningDirection
  onFiltersChange: (filters: ScreeningFilters) => void
  onSortChange: (sort: ScreeningSort) => void
  onDirectionChange: (direction: ScreeningDirection) => void
  onReset: () => void
}

// Empty numeric inputs mean no threshold, not zero.
function parseOptionalNumber(
  value: string,
  nonnegative = false,
): number | null {
  if (value.trim() === '') return null

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return null
  if (nonnegative && parsed < 0) return null

  return parsed
}

// Controls modify the displayed results only.
// They never modify underlying datasets or alignment.
export function InstrumentScreeningControls({
  filters,
  sort,
  direction,
  onFiltersChange,
  onSortChange,
  onDirectionChange,
  onReset,
}: Props) {
  return (
    <section
      className="panel"
      aria-label="Instrument Screening Controls"
    >
      <div className="panel-heading">
        <div>
          <h2>Quantitative Screening</h2>
          <p>
            Filter and sort historical instrument measurements.
          </p>
        </div>
        <span className="panel-tag">HISTORICAL</span>
      </div>

      <div className="detail-grid">
        <label className="detail-card">
          <span>Search Instruments</span>
          <input
            type="search"
            aria-label="Search Instruments"
            value={filters.search}
            onChange={(event) => onFiltersChange({
              ...filters,
              search: event.target.value,
            })}
            placeholder="Ticker or dataset name"
          />
        </label>

        <label className="detail-card">
          <span>Minimum Return (%)</span>
          <input
            type="number"
            aria-label="Minimum Return (%)"
            value={filters.minimumReturnPct ?? ''}
            onChange={(event) => onFiltersChange({
              ...filters,
              minimumReturnPct:
                parseOptionalNumber(event.target.value),
            })}
          />
        </label>

        <label className="detail-card">
          <span>Maximum Drawdown (%)</span>
          <input
            type="number"
            min="0"
            aria-label="Maximum Drawdown (%)"
            value={filters.maximumDrawdownPct ?? ''}
            onChange={(event) => onFiltersChange({
              ...filters,
              maximumDrawdownPct:
                parseOptionalNumber(event.target.value, true),
            })}
          />
        </label>

        <label className="detail-card">
          <span>Maximum Volatility (%)</span>
          <input
            type="number"
            min="0"
            aria-label="Maximum Volatility (%)"
            value={filters.maximumVolatilityPct ?? ''}
            onChange={(event) => onFiltersChange({
              ...filters,
              maximumVolatilityPct:
                parseOptionalNumber(event.target.value, true),
            })}
          />
        </label>

        <label className="detail-card">
          <span>Sort By</span>
          <select
            aria-label="Sort Instruments By"
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as ScreeningSort)
            }
          >
            <option value="return">Historical Return</option>
            <option value="volatility">Annualized Volatility</option>
            <option value="drawdown">Maximum Drawdown</option>
            <option value="name">Instrument Name</option>
          </select>
        </label>

        <label className="detail-card">
          <span>Sort Direction</span>
          <select
            aria-label="Sort Direction"
            value={direction}
            onChange={(event) =>
              onDirectionChange(
                event.target.value as ScreeningDirection,
              )
            }
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        className="research-upload-button"
        onClick={onReset}
      >
        Reset Screening
      </button>
    </section>
  )
}
