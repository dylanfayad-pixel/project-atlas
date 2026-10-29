import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  createInstrumentMetadata,
} from '../lib/instrumentMetadata'
import type { InstrumentMetadata } from '../lib/instrumentMetadata'
import type { ResearchDataset } from '../lib/researchSession'

type Props = {
  dataset: ResearchDataset
  onSave: (metadata: InstrumentMetadata) => void
}

// The editor labels a dataset without asserting that the
// underlying historical prices came from a verified provider.
export function InstrumentEditor({ dataset, onSave }: Props) {
  const [symbol, setSymbol] = useState(dataset.symbol ?? '')
  const [exchange, setExchange] =
    useState(dataset.exchange ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const metadata = createInstrumentMetadata(
        symbol,
        exchange
      )
      onSave(metadata)
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to save instrument metadata.'
      )
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Instrument Information</h2>
          <p>
            Identify the instrument represented by your
            uploaded market data.
          </p>
        </div>
        <span className="panel-tag">USER PROVIDED</span>
      </div>

      <form className="instrument-form" onSubmit={handleSubmit}>
        <div className="instrument-field">
          <label htmlFor="instrument-symbol">
            Instrument ticker
          </label>
          <input
            id="instrument-symbol"
            type="text"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="Example: AAPL, NVDA, SPY"
            maxLength={20}
            autoComplete="off"
          />
        </div>

        <div className="instrument-field">
          <label htmlFor="instrument-exchange">
            Exchange
          </label>
          <input
            id="instrument-exchange"
            type="text"
            value={exchange}
            onChange={(event) => setExchange(event.target.value)}
            placeholder="Example: NASDAQ, NYSE"
            maxLength={40}
            autoComplete="off"
          />
        </div>

        <p className="workspace-description">
          These labels are supplied by you. Atlas does not
          independently verify the instrument or the
          authenticity of uploaded market prices.
        </p>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <button
          className="research-upload-button"
          type="submit"
        >
          Save Instrument Information
        </button>
      </form>
    </section>
  )
}
