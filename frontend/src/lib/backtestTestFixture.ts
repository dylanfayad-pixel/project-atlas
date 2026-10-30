// Synthetic response fixture for backtest contract tests.

export function validResponse() {
  return {
    response_version: 1,
    signals: [
      {
        index: 0,
        timestamp: '2026-02-02',
        signal: 'BUY',
      },
    ],
    portfolio: {
      schema_version: 3,
      strategy: 'buy-and-hold',
      initial_capital: 10000,
      final_equity: 11363.636363636364,
      total_return_pct: 13.63636363636364,
      maximum_drawdown_pct: 0,
      trades: [
        {
          index: 1,
          timestamp: '2026-02-03',
          side: 'BUY',
          price: 110,
          quantity: 90.9090909090909,
          commission_paid: 0,
          slippage_cost: 0,
        },
      ],
      equity_curve: [
        {
          index: 0,
          timestamp: '2026-02-02',
          cash: 10000,
          shares: 0,
          equity: 10000,
        },
      ],
      risk_metrics: {
        return_observations: 2,
        periods_per_year: 252,
        risk_free_rate_per_period: 0,
        target_return_per_period: 0,
        annualized_volatility_pct: 0,
        sharpe_ratio: null,
        downside_deviation_pct: 0,
        sortino_ratio: null,
      },
    },
  }
}
