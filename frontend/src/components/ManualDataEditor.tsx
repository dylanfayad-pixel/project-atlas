import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  createManualRow,
  validateManualOhlcv,
} from '../lib/manualOhlcv'
import type { ManualOhlcvRow } from '../lib/manualOhlcv'
import type { OhlcvBar } from '../lib/ohlcvData'

type Props = {
  onLoad: (bars: OhlcvBar[]) => void
}

type Field = keyof ManualOhlcvRow

const FIELDS: { key: Field; label: string }[] = [
  { key: 'timestamp', label: 'Date (YYYY-MM-DD)' },
  { key: 'open', label: 'Open' },
  { key: 'high', label: 'High' },
  { key: 'low', label: 'Low' },
  { key: 'close', label: 'Close' },
  { key: 'volume', label: 'Volume' },
]

const MAX_ROWS = 5000

// Keep stable row identities so editing and deletion do not
// cause React to reuse the wrong input element.
type EditableRow = {
  id: string
  values: ManualOhlcvRow
}

function newRow(): EditableRow {
  return {
    id: crypto.randomUUID(),
    values: createManualRow(),
  }
}

export function ManualDataEditor({ onLoad }: Props) {
  const [rows, setRows] = useState<EditableRow[]>(() => [
    newRow(),
  ])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function updateRow(
    id: string,
    field: Field,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value

    setRows((previous) =>
      previous.map((row) =>
        row.id === id
          ? {
              ...row,
              values: {
                ...row.values,
                [field]: value,
              },
            }
          : row
      )
    )

    setError(null)
    setSuccess(null)
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) {
      setError(`Maximum ${MAX_ROWS} observations allowed.`)
      return
    }

    setRows((previous) => [...previous, newRow()])
    setError(null)
    setSuccess(null)
  }

  function removeRow(id: string) {
    setRows((previous) => previous.filter(
      (row) => row.id !== id
    ))
    setError(null)
    setSuccess(null)
  }

  function validateAndLoad() {
    setError(null)
    setSuccess(null)

    try {
      const bars = validateManualOhlcv(
        rows.map((row) => row.values)
      )

      onLoad(bars)
      setSuccess(
        `${bars.length} daily observations validated and loaded.`
      )
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to validate market observations.'
      )
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Manual Market Data Entry</h2>
          <p>
            Enter historical daily OHLCV observations.
            Each row represents one daily candle.
          </p>
        </div>
        <span className="panel-tag">MANUAL DATA</span>
      </div>

      <div className="table-scroll">
        <table className="manual-data-table">
          <thead>
            <tr>
              <th>Row</th>
              {FIELDS.map((field) => (
                <th key={field.key}>{field.label}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>

                {FIELDS.map((field) => (
                  <td key={field.key}>
                    <input
                      aria-label={`${field.label} row ${index + 1}`}
                      type="text"
                      value={row.values[field.key]}
                      onChange={(event) =>
                        updateRow(row.id, field.key, event)
                      }
                      placeholder={
                        field.key === 'timestamp'
                          ? 'YYYY-MM-DD'
                          : '0'
                      }
                    />
                  </td>
                ))}

                <td>
                  <button
                    type="button"
                    className="manual-remove-button"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="manual-data-actions">
        <button
          type="button"
          className="research-upload-button"
          onClick={addRow}
          disabled={rows.length >= MAX_ROWS}
        >
          <Plus size={16} aria-hidden="true" />
          Add Observation
        </button>

        <button
          type="button"
          className="research-upload-button"
          onClick={validateAndLoad}
        >
          Validate & Load Data
        </button>
      </div>

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
        Observations must use valid calendar dates in
        strictly increasing order. Prices must be positive,
        and volume must be a nonnegative integer.
        No backtest is executed by this form.
      </p>
    </section>
  )
}
