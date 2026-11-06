import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchHistoricalData } from '../lib/historicalDataClient'
import type { HistoricalDataResponse } from '../lib/historicalDataResponse'

type Props = {
  onDataLoaded: (data: HistoricalDataResponse) => boolean
}

// A ticker lookup uses Atlas's validated same-origin API.
// Never send provider credentials from the browser.
export function TickerSearch({ onDataLoaded }: Props) {
  // This flag controls UI availability only.
  // The server independently enforces authorization.
  const tickerSearchEnabled =
    import.meta.env.VITE_ENABLE_TICKER_SEARCH === 'true'
  const [symbol, setSymbol] = useState('')
  const [startDate, setStartDate] = useState('2025-01-01')
  const [endDate, setEndDate] = useState('2025-12-31')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
      controllerRef.current?.abort()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // A new request supersedes any earlier pending request.
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const requestId = ++requestIdRef.current

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetchHistoricalData(
        symbol,
        startDate,
        endDate,
        { signal: controller.signal },
      )

      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) return

      const accepted = onDataLoaded(response)

      if (!accepted) {
        setError('Research collection is full. Remove a dataset and retry.')
        return
      }

      setSuccess(
        `${response.symbol}: ${response.bars.length} historical observations loaded.`,
      )
    } catch (cause: unknown) {
      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) return

      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to retrieve historical market data.',
      )
    } finally {
      if (requestId === requestIdRef.current) {
        controllerRef.current = null
        setLoading(false)
      }
    }
  }

  function handleCancel() {
    requestIdRef.current += 1
    controllerRef.current?.abort()
    controllerRef.current = null
    setLoading(false)
    setError(null)
    setSuccess(null)
  }

  return (
    <section className="panel" aria-label="Ticker Search">
      <div className="panel-heading">
        <div>
          <h2>Search Historical Market Data</h2>
          <p>
            Retrieve validated daily OHLCV observations
            using a stock ticker and date range.
          </p>
        </div>
        <span className="panel-tag">MARKET DATA API</span>
      </div>

      {!tickerSearchEnabled && (
        <p className="workspace-description" role="note">
          Automatic ticker retrieval is not available in this
          public release. Use CSV upload or manual data entry
          to analyze historical market data.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="detail-grid">
          <label className="detail-card">
            <span>Stock Ticker</span>
            <input
              aria-label="Stock Ticker"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="AAPL"
              autoComplete="off"
              required
              disabled={loading}
            />
          </label>

          <label className="detail-card">
            <span>Start Date</span>
            <input
              aria-label="Historical Start Date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
              disabled={loading}
            />
          </label>

          <label className="detail-card">
            <span>End Date</span>
            <input
              aria-label="Historical End Date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
              disabled={loading}
            />
          </label>
        </div>

        <div className="manual-data-actions">
          <button
            type="submit"
            className="research-upload-button"
            disabled={loading || !tickerSearchEnabled}
          >
            {loading ? 'Loading Historical Data...' : 'Load Historical Data'}
          </button>

          {loading && (
            <button
              type="button"
              className="research-upload-button"
              onClick={handleCancel}
            >
              Cancel Request
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="research-import-success" role="status">
          {success}
        </div>
      )}

      <p className="workspace-description">
        Historical data is retrieved through Atlas's server-side
        provider. Availability depends on provider configuration.
        Returned prices may be unadjusted. Historical data does
        not predict future performance.
      </p>
    </section>
  )
}
