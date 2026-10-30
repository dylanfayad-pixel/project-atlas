import { useEffect, useRef, useState } from 'react'
import { runBacktest } from '../lib/backtestApi'
import type { BacktestResult } from '../lib/backtestApi'
import {
  DEFAULT_BACKTEST_DRAFT,
  emptyBacktestExecution,
  parseBacktestDraft,
} from '../lib/backtestWorkspace'
import type {
  BacktestDraft,
} from '../lib/backtestWorkspace'
import type { ResearchDataset } from '../lib/researchSession'

// Persist backtest execution across workspace navigation.
export function useBacktestController(
  dataset: ResearchDataset | null,
  onExecutionStarted: () => void
) {
  const [draft, setDraft] = useState(DEFAULT_BACKTEST_DRAFT)
  const [execution, setExecution] =
    useState(emptyBacktestExecution)

  const controllerRef = useRef<AbortController | null>(null)
  const generation = useRef(0)

  useEffect(() => {
    return () => {
      generation.current += 1
      controllerRef.current?.abort()
    }
  }, [])

  // Invalidate results when the active dataset changes.
  const datasetId = dataset?.id ?? null
  const previousDatasetId = useRef(datasetId)

  useEffect(() => {
    if (previousDatasetId.current !== datasetId) {
      previousDatasetId.current = datasetId
      generation.current += 1
      controllerRef.current?.abort()
      setExecution(emptyBacktestExecution())
    }
  }, [datasetId])

  function updateDraft(
    key: keyof BacktestDraft,
    value: string
  ) {
    generation.current += 1
    controllerRef.current?.abort()

    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }))

    setExecution(emptyBacktestExecution())
  }

  async function execute() {
    if (!dataset) return

    generation.current += 1
    const requestId = generation.current

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    let config

    try {
      config = parseBacktestDraft(draft)
    } catch (cause: unknown) {
      setExecution({
        datasetId: dataset.id,
        status: 'error',
        result: null,
        error: cause instanceof Error
          ? cause.message
          : 'Invalid backtest configuration.',
      })
      return
    }

    setExecution({
      datasetId: dataset.id,
      status: 'running',
      result: null,
      error: null,
    })

    onExecutionStarted()

    try {
      const result: BacktestResult = await runBacktest(
        dataset.bars,
        config,
        controller.signal
      )

      if (
        !controller.signal.aborted &&
        requestId === generation.current
      ) {
        setExecution({
          datasetId: dataset.id,
          status: 'success',
          result,
          error: null,
        })
      }
    } catch (cause: unknown) {
      if (
        !controller.signal.aborted &&
        requestId === generation.current
      ) {
        setExecution({
          datasetId: dataset.id,
          status: 'error',
          result: null,
          error: cause instanceof Error
            ? cause.message
            : 'Backtest execution failed.',
        })
      }
    }
  }

  // Never expose results belonging to another dataset.
  const visibleExecution =
    execution.datasetId === null ||
    execution.datasetId === datasetId
      ? execution
      : emptyBacktestExecution()

  return {
    draft,
    execution: visibleExecution,
    updateDraft,
    execute,
  }
}
