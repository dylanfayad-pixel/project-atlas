import type { BacktestDraft } from '../lib/backtestWorkspace'

type Props = {
  draft: BacktestDraft
  running: boolean
  onChange: (
    key: keyof BacktestDraft,
    value: string
  ) => void
  onRun: () => void
}

// Reuse one configuration form throughout the research workflow.
export function BacktestConfigForm({
  draft,
  running,
  onChange,
  onRun,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Configure & Run Backtest</h2>
          <p>
            Select a strategy and execute the C++ research engine.
          </p>
        </div>
        <span className="panel-tag">BACKTEST SETUP</span>
      </div>

      <div className="backtest-form">
        <label>
          Strategy
          <select
            value={draft.strategy}
            onChange={(event) =>
              onChange('strategy', event.target.value)
            }
          >
            <option value="buy-and-hold">Buy & Hold</option>
            <option value="sma-crossover">SMA Crossover</option>
          </select>
        </label>

        <label>
          Starting Capital ($)
          <input
            type="number"
            min="1"
            step="any"
            value={draft.capital}
            onChange={(event) =>
              onChange('capital', event.target.value)
            }
          />
        </label>

        <label>
          Commission ($)
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0 (optional)"
            value={draft.commission}
            onChange={(event) =>
              onChange('commission', event.target.value)
            }
          />
        </label>

        <label>
          Slippage (basis points)
          <input
            type="number"
            min="0"
            max="9999"
            step="any"
            placeholder="0 (optional)"
            value={draft.slippage_bps}
            onChange={(event) =>
              onChange('slippage_bps', event.target.value)
            }
          />
        </label>

        {draft.strategy === 'sma-crossover' && (
          <>
            <label>
              Fast SMA Period
              <input
                type="number"
                min="1"
                step="1"
                value={draft.fast}
                onChange={(event) =>
                  onChange('fast', event.target.value)
                }
              />
            </label>

            <label>
              Slow SMA Period
              <input
                type="number"
                min="2"
                step="1"
                value={draft.slow}
                onChange={(event) =>
                  onChange('slow', event.target.value)
                }
              />
            </label>
          </>
        )}
      </div>

      <button
        type="button"
        className="research-upload-button"
        onClick={onRun}
        disabled={running}
      >
        {running ? 'Running Backtest...' : 'Run Backtest'}
      </button>
    </section>
  )
}
