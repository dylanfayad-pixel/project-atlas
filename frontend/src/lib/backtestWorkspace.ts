import type {
  BacktestConfig,
  BacktestResult,
  BacktestStrategy,
} from './backtestApi'

// Preserve editable text until the user submits the form.
export type BacktestDraft = {
  strategy: BacktestStrategy
  capital: string
  commission: string
  slippage_bps: string
  fast: string
  slow: string
}

export type BacktestExecution = {
  datasetId: string | null
  status: 'idle' | 'running' | 'success' | 'error'
  result: BacktestResult | null
  error: string | null
}

export const DEFAULT_BACKTEST_DRAFT: BacktestDraft = {
  strategy: 'buy-and-hold',
  capital: '10000',
  commission: '',
  slippage_bps: '',
  fast: '3',
  slow: '5',
}

export function emptyBacktestExecution(): BacktestExecution {
  return {
    datasetId: null,
    status: 'idle',
    result: null,
    error: null,
  }
}

// Convert editable fields only when executing a backtest.
export function parseBacktestDraft(
  draft: BacktestDraft
): BacktestConfig {
  const capital = Number(draft.capital)
  const commission = draft.commission.trim() === ''
    ? 0
    : Number(draft.commission)
  const slippage = draft.slippage_bps.trim() === ''
    ? 0
    : Number(draft.slippage_bps)

  const fast = Number(draft.fast)
  const slow = Number(draft.slow)

  if (
    !draft.capital.trim() ||
    !Number.isFinite(capital) ||
    capital <= 0 ||
    !Number.isFinite(commission) ||
    commission < 0 ||
    !Number.isFinite(slippage) ||
    slippage < 0 ||
    slippage >= 10000 ||
    !draft.fast.trim() ||
    !draft.slow.trim() ||
    !Number.isInteger(fast) ||
    !Number.isInteger(slow) ||
    fast < 1 ||
    slow <= fast
  ) {
    throw new Error('Please enter valid backtest settings.')
  }

  return {
    strategy: draft.strategy,
    capital,
    commission,
    slippage_bps: slippage,
    fast,
    slow,
  }
}
