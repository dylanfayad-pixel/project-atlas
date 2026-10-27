// Data contract for the Atlas Terminal demonstration.
//
// This module is responsible for parsing exported historical
// strategy data. UI components should not parse CSV directly.

export type MarketPoint = {
  index: number
  timestamp: string
  price: number
  signal: 'BUY' | 'SELL' | 'HOLD'
}

// Validate the expected four-column demonstration format.
// This intentionally supports a restricted CSV schema;
// general quoted-field CSV support is not implemented.
export function parseMarketData(csv: string): MarketPoint[] {
  const lines = csv.trim().split(/\r?\n/)

  if (lines[0] !== 'index,timestamp,price,signal') {
    throw new Error('Unexpected market data format')
  }

  return lines.slice(1).map((line, rowIndex) => {
    const fields = line.split(',')

    if (fields.length !== 4) {
      throw new Error(`Invalid column count at row ${rowIndex + 2}`)
    }

    const [index, timestamp, price, signal] = fields

    const parsedIndex = Number(index)
    const parsedPrice = Number(price)

    if (
      !Number.isInteger(parsedIndex) ||
      parsedIndex < 0 ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0 ||
      !timestamp ||
      !['BUY', 'SELL', 'HOLD'].includes(signal)
    ) {
      throw new Error(`Invalid market data at row ${rowIndex + 2}`)
    }

    return {
      index: parsedIndex,
      timestamp,
      price: parsedPrice,
      signal: signal as MarketPoint['signal'],
    }
  })
}
