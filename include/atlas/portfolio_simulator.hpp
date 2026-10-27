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

    std::vector<SimulatedTrade> trades;
    std::vector<EquityPoint> equity_curve;
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
    // - Zero fees and slippage
    // - All available cash invested on BUY
    // - Entire position liquidated on SELL
    static PortfolioResult run(
        const std::vector<MarketBar>& bars,
        const std::vector<SignalEvent>& signals,
        double initial_capital = 10000.0
    );
};

} // namespace atlas
