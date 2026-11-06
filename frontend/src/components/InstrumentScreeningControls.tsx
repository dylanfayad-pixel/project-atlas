import { useState } from 'react'

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

type NumericFilter =
  | 'minimumReturnPct'
  | 'maximumDrawdownPct'
  | 'maximumVolatilityPct'

function parseThreshold(
  value: string,
  nonnegative: boolean,
): number | null | 'invalid' {
  if (value.trim() === '') return null

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return 'invalid'
  if (nonnegative && parsed < 0) return 'invalid'

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
  const [errors, setErrors] =
    useState<Partial<Record<NumericFilter, string>>>({})

  const [rawValues, setRawValues] = useState<
    Record<NumericFilter, string>
  >({
    minimumReturnPct: String(filters.minimumReturnPct ?? ''),
    maximumDrawdownPct: String(filters.maximumDrawdownPct ?? ''),
    maximumVolatilityPct: String(filters.maximumVolatilityPct ?? ''),
  })

  function updateNumericFilter(
    field: NumericFilter,
    value: string,
    nonnegative: boolean,
  ) {
    setRawValues((previous) => ({
      ...previous,
      [field]: value,
    }))

    const parsed = parseThreshold(value, nonnegative)

    if (parsed === 'invalid') {
      setErrors((previous) => ({
        ...previous,
        [field]: nonnegative
          ? 'Enter a nonnegative number.'
          : 'Enter a valid number.',
      }))
      return
    }

    setErrors((previous) => ({
      ...previous,
      [field]: '',
    }))

    onFiltersChange({
      ...filters,
      [field]: parsed,
    })
  }

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

      <p className="workspace-description">
        Leave a numeric field empty to disable that filter.
        Return thresholds may be negative. Drawdown and
        volatility limits must be nonnegative.
      </p>

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
            aria-describedby={errors.minimumReturnPct ? 'minimum-return-error' : undefined}
            aria-invalid={Boolean(errors.minimumReturnPct)}
            step="any"
            value={rawValues.minimumReturnPct}
            onChange={(event) =>
              updateNumericFilter(
                'minimumReturnPct',
                event.target.value,
                false,
              )
            }
          />
          {errors.minimumReturnPct && (
            <span id="minimum-return-error" className="field-error">
              {errors.minimumReturnPct}
            </span>
          )}
        </label>

        <label className="detail-card">
          <span>Maximum Drawdown (%)</span>
          <input
            type="number"
            min="0"
            aria-label="Maximum Drawdown (%)"
            aria-describedby={errors.maximumDrawdownPct ? 'maximum-drawdown-error' : undefined}
            aria-invalid={Boolean(errors.maximumDrawdownPct)}
            step="any"
            value={rawValues.maximumDrawdownPct}
            onChange={(event) =>
              updateNumericFilter(
                'maximumDrawdownPct',
                event.target.value,
                true,
              )
            }
          />
          {errors.maximumDrawdownPct && (
            <span id="maximum-drawdown-error" className="field-error">
              {errors.maximumDrawdownPct}
            </span>
          )}
        </label>

        <label className="detail-card">
          <span>Maximum Volatility (%)</span>
          <input
            type="number"
            min="0"
            aria-label="Maximum Volatility (%)"
            aria-describedby={errors.maximumVolatilityPct ? 'maximum-volatility-error' : undefined}
            aria-invalid={Boolean(errors.maximumVolatilityPct)}
            step="any"
            value={rawValues.maximumVolatilityPct}
            onChange={(event) =>
              updateNumericFilter(
                'maximumVolatilityPct',
                event.target.value,
                true,
              )
            }
          />
          {errors.maximumVolatilityPct && (
            <span id="maximum-volatility-error" className="field-error">
              {errors.maximumVolatilityPct}
            </span>
          )}
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

      {Object.values(errors).some(Boolean) && (
        <p className="error-banner" role="alert">
          Correct the highlighted screening fields.
        </p>
      )}

      <button
        type="button"
        className="research-upload-button"
        onClick={() => {
          setErrors({})
          setRawValues({
            minimumReturnPct: '',
            maximumDrawdownPct: '',
            maximumVolatilityPct: '',
          })
          onReset()
        }}
      >
        Reset Screening
      </button>
    </section>
  )
}
