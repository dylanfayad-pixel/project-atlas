// User-provided instrument labels are descriptive metadata.
// They do not authenticate the underlying historical prices.

export type InstrumentMetadata = {
  symbol: string | null
  exchange: string | null
  verified: false
}

const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.^_-]{0,19}$/

export function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase()
}

export function validateSymbol(value: string): string {
  const symbol = normalizeSymbol(value)

  if (!SYMBOL_PATTERN.test(symbol)) {
    throw new Error(
      'Ticker must contain 1-20 valid symbol characters.'
    )
  }

  return symbol
}

export function createInstrumentMetadata(
  symbolInput: string,
  exchangeInput: string
): InstrumentMetadata {
  const symbol = symbolInput.trim()
    ? validateSymbol(symbolInput)
    : null

  const exchange = exchangeInput.trim()
    ? exchangeInput.trim().toUpperCase()
    : null

  if (exchange && !/^[A-Z0-9 ._-]{1,40}$/.test(exchange)) {
    throw new Error('Invalid exchange label.')
  }

  if (!symbol && exchange) {
    throw new Error(
      'Enter an instrument ticker before specifying an exchange.'
    )
  }

  return {
    symbol,
    exchange,
    verified: false,
  }
}
