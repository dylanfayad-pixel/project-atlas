import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
} from 'lightweight-charts'
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  Time,
} from 'lightweight-charts'

import type { OhlcvBar } from '../lib/ohlcvData'

type Props = {
  bars: OhlcvBar[]
}

const UP = '#26c6a0'
const DOWN = '#ef5350'

// Display validated daily OHLCV bars without changing
// their prices, timestamps, or volume observations.
export function CandlestickChart({ bars }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || bars.length === 0) return

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 440,
      layout: {
        background: {
          type: ColorType.Solid,
          color: '#101b2c',
        },
        textColor: '#a6b6cc',
      },
      grid: {
        vertLines: { color: '#203047' },
        horzLines: { color: '#203047' },
      },
      rightPriceScale: {
        borderColor: '#31445d',
      },
      timeScale: {
        borderColor: '#31445d',
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: '#657b98' },
        horzLine: { color: '#657b98' },
      },
    })

    chartRef.current = chart

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      borderUpColor: UP,
      borderDownColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
    })

    const volumes = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    })

    // Reserve the lower portion for volume bars.
    volumes.priceScale().applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
    })

    const candleData: CandlestickData<Time>[] =
      bars.map((bar) => ({
        time: bar.timestamp as Time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      }))

    const volumeData: HistogramData<Time>[] =
      bars.map((bar) => ({
        time: bar.timestamp as Time,
        value: bar.volume,
        color: bar.close >= bar.open
          ? 'rgba(38,198,160,0.45)'
          : 'rgba(239,83,80,0.45)',
      }))

    candles.setData(candleData)
    volumes.setData(volumeData)
    chart.timeScale().fitContent()

    // Keep the chart synchronized with responsive layouts.
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width && width > 0) {
        chart.applyOptions({ width })
      }
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [bars])

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>Historical Candlestick Chart</h2>
          <p>
            Validated daily OHLCV data with trading volume.
            No strategy signals have been generated.
          </p>
        </div>
        <span className="panel-tag">MARKET DATA</span>
      </div>

      {bars.length === 0 ? (
        <p className="workspace-description">
          Upload a valid OHLCV CSV to view market candles.
        </p>
      ) : (
        <div
          ref={containerRef}
          className="candlestick-chart"
          role="img"
          aria-label="Historical candlestick and volume chart"
        />
      )}
    </section>
  )
}
