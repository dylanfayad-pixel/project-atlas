// Strict browser-side OHLCV validation for research imports.
// This parser is separate from the legacy signal-demo format.

export type OhlcvBar = {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const HEADER = 'timestamp,open,high,low,close,volume'

// Require a real calendar date rather than relying on
// JavaScript's permissive date normalization.
function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  )
}

// Convert a numeric CSV field without accepting empty strings,
// NaN, infinity, or JavaScript's permissive whitespace conversion.
function parseNumber(value: string, row: number): number {
  if (!value.trim()) {
    throw new Error(`Missing numeric value at row ${row}`)
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value at row ${row}`)
  }

  return parsed
}

// Parse a restricted six-column CSV contract.
// Quoted fields and alternate column mappings are intentionally
// unsupported in this first implementation.
export function parseOhlcvCsv(csv: string): OhlcvBar[] {
  const lines = csv.trim().replace(/^\uFEFF/, '').split(/\r?\n/)

  if (lines.length < 2 || lines[0] !== HEADER) {
    throw new Error(
      'Expected CSV header: timestamp,open,high,low,close,volume'
    )
  }

  const bars: OhlcvBar[] = []
  let previousTimestamp = ''

  for (let i = 1; i < lines.length; i++) {
    const row = i + 1
    const fields = lines[i].split(',')

    if (fields.length !== 6) {
      throw new Error(`Expected six columns at row ${row}`)
    }

    const [timestamp, openText, highText, lowText,
      closeText, volumeText] = fields

    if (!validDate(timestamp)) {
      throw new Error(`Invalid calendar date at row ${row}`)
    }

    if (previousTimestamp &&
        timestamp <= previousTimestamp) {
      throw new Error(
        `Timestamps must be strictly increasing at row ${row}`
      )
    }

    const open = parseNumber(openText, row)
    const high = parseNumber(highText, row)
    const low = parseNumber(lowText, row)
    const close = parseNumber(closeText, row)
    const volume = parseNumber(volumeText, row)

    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
      throw new Error(`Prices must be positive at row ${row}`)
    }

    if (high < low ||
        high < Math.max(open, close) ||
        low > Math.min(open, close)) {
      throw new Error(`Invalid OHLC price relationship at row ${row}`)
    }

    if (!Number.isSafeInteger(volume) || volume < 0) {
      throw new Error(
        `Volume must be a nonnegative safe integer at row ${row}`
      )
    }

    bars.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    })

    previousTimestamp = timestamp
  }

  return bars
}
