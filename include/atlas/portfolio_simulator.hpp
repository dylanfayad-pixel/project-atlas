#pragma once

#include "atlas/backtest_runner.hpp"
#include "atlas/market_bar.hpp"

#include <cstddef>
#include <string>
#include <vector>

namespace atlas {

// A simulated order fill, not an actual market transaction.
struct SimulatedTrade {
    std::size_t index;
    std::string timestamp;
    Signal side;
    double price;
    double quantity;

    // Costs charged for this simulated fill.
    // Default values preserve existing aggregate initializers.
    double commission_paid = 0.0;
    double slippage_cost = 0.0;
};

// Portfolio value recorded after each historical bar.
struct EquityPoint {
    std::size_t index;
    std::string timestamp;
    double cash;
    double shares;
    double equity;
};

// Results from a deterministic historical execution simulation.
struct PortfolioResult {
    double initial_capital;
    double final_equity;
    double total_return_pct;

    // Aggregated costs across successfully executed fills.
    double total_commission = 0.0;
    double total_slippage_cost = 0.0;

    std::vector<SimulatedTrade> trades;
    std::vector<EquityPoint> equity_curve;
};

// Configurable simulated execution costs.
// Defaults preserve the original zero-cost model.
struct ExecutionConfig {
    double commission_per_trade = 0.0;
    double slippage_bps = 0.0;

    // Fraction of available cash allocated to a new BUY.
    // 1.0 preserves the original all-in execution model.
    // This limits entry allocation, not future exposure.
    double max_entry_allocation = 1.0;

    // Maximum position exposure immediately after BUY,
    // valued at the bar's opening market price.
    // 1.0 preserves the original unrestricted entry model.
    double max_entry_exposure = 1.0;

    // Maximum allowed close-observed drawdown as a fraction
    // of the historical closing-equity high-water mark.
    // 1.0 disables the circuit breaker by default.
    double max_drawdown_fraction = 1.0;

    // If enabled, a drawdown breach requests liquidation
    // at the next available bar's opening price.
    // This setting has no effect while the breaker is disabled.
    bool liquidate_on_drawdown = false;
};

class PortfolioSimulator {
public:
    // Signals are generated at bar close and executed at the
    // next bar's open. The final bar cannot create a new fill.
    //
    // This initial model assumes:
    // - Long-only trading
    // - Fractional shares
    // - No leverage
    // - Configurable fees and adverse slippage
    // - Configurable BUY allocation (100% by default)
    // - Entire position liquidated on SELL
    static PortfolioResult run(
        const std::vector<MarketBar>& bars,
        const std::vector<SignalEvent>& signals,
        double initial_capital = 10000.0,
        const ExecutionConfig& config = {}
    );
};

} // namespace atlas
