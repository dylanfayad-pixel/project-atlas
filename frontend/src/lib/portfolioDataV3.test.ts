import { describe, expect, it } from 'vitest'
import { parsePortfolioData } from './portfolioData'
import portfolioFixture from '../../public/data/demo_portfolio_v3.json'

// Import the real C++-generated fixture through Vite.
// Clone it so each test receives independent data.
function validV3(): Record<string, unknown> {
  return structuredClone(portfolioFixture) as Record<string, unknown>
}

// Clone through JSON to ensure every mutation is isolated.
type MutableFixture = Record<string, unknown> & {
  risk_metrics?: Record<string, unknown>
  exposure: {
    observations: Array<Record<string, unknown>>
    maximum_observed_fraction: number
  }
  risk_controls: {
    liquidate_on_drawdown: boolean
    events: Array<Record<string, unknown>>
  }
  trades: Array<Record<string, unknown>>
}

function modifiedV3(
  change: (data: MutableFixture) => void
): Record<string, unknown> {
  const data = validV3() as MutableFixture
  change(data)
  return data
}

describe('Portfolio JSON schema v3', () => {
  it('accepts a real C++ generated report', () => {
    const result = parsePortfolioData(validV3())

    expect(result.schema_version).toBe(3)

    if (result.schema_version === 3) {
      expect(result.risk_metrics.return_observations).toBe(3)
      expect(result.exposure.observations).toHaveLength(4)
      expect(result.risk_controls.events).toHaveLength(2)
    }
  })

  it('rejects missing risk metrics', () => {
    const data = modifiedV3((value) => {
      delete value.risk_metrics
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects non-finite risk statistics', () => {
    const data = modifiedV3((value) => {
      value.risk_metrics!.sharpe_ratio = Infinity
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects mismatched return observations', () => {
    const data = modifiedV3((value) => {
      value.risk_metrics!.return_observations = 100
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects invalid exposure fractions', () => {
    const data = modifiedV3((value) => {
      value.exposure.observations[1].fraction = 1.5
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects inconsistent exposure accounting', () => {
    const data = modifiedV3((value) => {
      value.exposure.observations[1].fraction = 0.25
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects mismatched maximum exposure', () => {
    const data = modifiedV3((value) => {
      value.exposure.maximum_observed_fraction = 0.25
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects invalid risk-event timestamps', () => {
    const data = modifiedV3((value) => {
      value.risk_controls.events[0].timestamp = 'Wrong Day'
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects liquidation events without SELL fills', () => {
    const data = modifiedV3((value) => {
      value.risk_controls.events[1].index = 2
      value.risk_controls.events[1].timestamp = 'Day 3'
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects liquidation with the policy disabled', () => {
    const data = modifiedV3((value) => {
      value.risk_controls.liquidate_on_drawdown = false
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects duplicate breach events', () => {
    const data = modifiedV3((value) => {
      value.risk_controls.events.push({
        ...value.risk_controls.events[0],
      })
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects unsupported risk-event types', () => {
    const data = modifiedV3((value) => {
      value.risk_controls.events[0].type = 'UNKNOWN_EVENT'
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects missing execution cost fields', () => {
    const data = modifiedV3((value) => {
      delete value.trades[0].commission_paid
    })

    expect(() => parsePortfolioData(data)).toThrow()
  })
})
