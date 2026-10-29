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

// Events produced by the portfolio risk-control state machine.
// These describe simulation decisions, not brokerage orders.
enum class RiskEventType {
    DrawdownBreach,
    LiquidationExecuted,
    LiquidationRejected
};

// A timestamped observation or outcome from risk enforcement.
struct RiskEvent {
    std::size_t index;
    std::string timestamp;
    RiskEventType type;

    // Drawdown observed at the event's bar close.
    // Execution events may leave this unset because they
    // occur at the next bar's opening price.
    double drawdown_fraction = 0.0;
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

    // Chronological risk-control events produced during replay.
    // Existing JSON v1/v2 serialization remains unchanged.
    std::vector<RiskEvent> risk_events;
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
