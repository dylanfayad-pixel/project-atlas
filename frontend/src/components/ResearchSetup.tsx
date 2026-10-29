import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FileUp, Database, ShieldCheck } from 'lucide-react'
import { parseOhlcvCsv } from '../lib/ohlcvData'
import type { OhlcvBar } from '../lib/ohlcvData'

// Limit browser-side imports to avoid excessive memory use.
const MAX_FILE_BYTES = 10 * 1024 * 1024

export function ResearchSetup() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [bars, setBars] = useState<OhlcvBar[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Validate the complete file before exposing imported data.
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setBars([])
    setFilename(null)

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please select a CSV file.')
      }

      if (file.size > MAX_FILE_BYTES) {
        throw new Error('CSV file exceeds the 10 MB import limit.')
      }

      const text = await file.text()
      const parsed = parseOhlcvCsv(text)

      setBars(parsed)
      setFilename(file.name)
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to import this CSV file.'
      )
    } finally {
      setLoading(false)

      // Permit reselecting the same file after a correction.
      if (fileInput.current) {
        fileInput.current.value = ''
      }
    }
  }

  return (
    <div className="research-setup">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Market Data Import</h2>
            <p>
              Load and validate historical OHLCV market data
              before configuring a research session.
            </p>
          </div>
          <span className="panel-tag">DATA SOURCE</span>
        </div>

        <div className="research-upload">
          <Database size={24} aria-hidden="true" />

          <div>
            <strong>Historical CSV Dataset</strong>
            <p>
              Required columns: timestamp, open, high,
              low, close, volume.
            </p>
            <p>
              Dates must use YYYY-MM-DD.
              This importer currently supports daily bars.
            </p>
          </div>

          <input
            ref={fileInput}
            className="research-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            aria-label="Upload daily OHLCV CSV"
            disabled={loading}
          />

          <button
            type="button"
            className="research-upload-button"
            onClick={() => fileInput.current?.click()}
            disabled={loading}
          >
            <FileUp size={16} aria-hidden="true" />
            {loading ? 'Validating...' : 'Choose CSV File'}
          </button>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {bars.length > 0 && (
          <div className="research-import-success" role="status">
            <ShieldCheck size={18} aria-hidden="true" />
            Dataset validated successfully.
          </div>
        )}
      </section>

      {bars.length > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Dataset Preview</h2>
              <p>{filename}</p>
            </div>
            <span className="panel-tag">VALIDATED</span>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <span>OBSERVATIONS</span>
              <strong>{bars.length.toLocaleString()}</strong>
            </div>
            <div className="detail-card">
              <span>FIRST DATE</span>
              <strong>{bars[0].timestamp}</strong>
            </div>
            <div className="detail-card">
              <span>LAST DATE</span>
              <strong>{bars[bars.length - 1].timestamp}</strong>
            </div>
            <div className="detail-card">
              <span>TIMEFRAME</span>
              <strong>1 Day / Candle</strong>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>Close</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {bars.slice(0, 10).map((bar) => (
                  <tr key={bar.timestamp}>
                    <td>{bar.timestamp}</td>
                    <td>{bar.open.toFixed(2)}</td>
                    <td>{bar.high.toFixed(2)}</td>
                    <td>{bar.low.toFixed(2)}</td>
                    <td>{bar.close.toFixed(2)}</td>
                    <td>{bar.volume.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="workspace-description">
            Showing the first {Math.min(10, bars.length)}
            {' '}observations. Data is validated locally.
            No backtest has been executed.
          </p>
        </section>
      )}
    </div>
  )
}
