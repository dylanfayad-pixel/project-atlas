#include "atlas/portfolio_simulator.hpp"
#include "atlas/market_bar_validator.hpp"

#include <cmath>
#include <stdexcept>

namespace atlas {

PortfolioResult PortfolioSimulator::run(
    const std::vector<MarketBar>& bars,
    const std::vector<SignalEvent>& signals,
    double initial_capital,
    const ExecutionConfig& config
) {
    // Validate capital and execution assumptions before replay.
    if (!std::isfinite(initial_capital) ||
        initial_capital <= 0.0) {
        throw std::invalid_argument(
            "Initial capital must be positive and finite"
        );
    }

    if (!std::isfinite(config.commission_per_trade) ||
        config.commission_per_trade < 0.0 ||
        !std::isfinite(config.slippage_bps) ||
        config.slippage_bps < 0.0 ||
        config.slippage_bps >= 10000.0) {
        throw std::invalid_argument(
            "Invalid execution cost configuration"
        );
    }

    if (bars.size() != signals.size()) {
        throw std::invalid_argument(
            "Market bars and signals must have equal lengths"
        );
    }

    // Validate the full input before executing any trades.
    for (std::size_t i = 0; i < bars.size(); ++i) {
        const auto& bar = bars[i];
        const auto& event = signals[i];

        if (!is_valid_market_bar(bar)) {
            throw std::invalid_argument(
                "Invalid market bar at index " +
                std::to_string(i)
            );
        }

        if (event.index != i ||
            event.timestamp != bar.timestamp) {
            throw std::invalid_argument(
                "Signal and market bar alignment mismatch"
            );
        }

        if (event.signal != Signal::Hold &&
            event.signal != Signal::Buy &&
            event.signal != Signal::Sell) {
            throw std::invalid_argument(
                "Invalid trading signal"
            );
        }

        if (i > 0 &&
            bar.timestamp == bars[i - 1].timestamp) {
            throw std::invalid_argument(
                "Duplicate market timestamp"
            );
        }
    }

    PortfolioResult result{};
    result.initial_capital = initial_capital;

    double cash = initial_capital;
    double shares = 0.0;

    result.trades.reserve(signals.size());
    result.equity_curve.reserve(bars.size());

    const double slip = config.slippage_bps / 10000.0;
    const double commission = config.commission_per_trade;

    for (std::size_t i = 0; i < bars.size(); ++i) {
        const auto& bar = bars[i];

        // Signals generated at the previous close become
        // eligible for execution at this bar's opening price.
        if (i > 0) {
            const Signal pending = signals[i - 1].signal;

            if (pending == Signal::Buy && shares == 0.0 &&
                cash > commission) {

                const double price = bar.open * (1.0 + slip);
                const double budget = cash - commission;
                const double quantity = budget / price;

                if (!std::isfinite(price) ||
                    !std::isfinite(quantity) ||
                    price <= 0.0 ||
                    quantity <= 0.0) {
                    throw std::overflow_error(
                        "Invalid BUY execution arithmetic"
                    );
                }

                const double cost = quantity * price;

                if (!std::isfinite(cost)) {
                    throw std::overflow_error(
                        "Non-finite BUY cost"
                    );
                }

                // Deduct the actual fill cost and commission.
                // Preserve residual cash instead of assuming it is zero.
                double remaining = cash - cost - commission;

                if (!std::isfinite(remaining)) {
                    throw std::overflow_error(
                        "Non-finite remaining cash"
                    );
                }

                // Floating-point rounding can leave a tiny negative
                // remainder when investing almost all available cash.
                const double tolerance = 1e-12 * cash;

                if (remaining < -tolerance) {
                    throw std::overflow_error(
                        "BUY exceeded available cash"
                    );
                }

                if (remaining < 0.0) {
                    remaining = 0.0;
                }

                // Measure adverse price movement against the open.
                const double slippage_cost =
                    quantity * (price - bar.open);

                if (!std::isfinite(slippage_cost) ||
                    slippage_cost < 0.0) {
                    throw std::overflow_error(
                        "Invalid BUY slippage cost"
                    );
                }

                shares = quantity;
                cash = remaining;

                result.trades.push_back({
                    i, bar.timestamp, Signal::Buy,
                    price, quantity,
                    commission, slippage_cost
                });

            } else if (pending == Signal::Sell &&
                       shares > 0.0) {

                const double price = bar.open * (1.0 - slip);
                const double quantity = shares;
                const double proceeds = quantity * price;

                if (!std::isfinite(price) ||
                    !std::isfinite(proceeds) ||
                    price <= 0.0) {
                    throw std::overflow_error(
                        "Invalid SELL execution arithmetic"
                    );
                }

                // A sell cannot create a negative cash balance.
                // If commission exceeds proceeds, reject the fill.
                if (proceeds >= commission) {
                    // Record the adverse SELL price movement.
                    const double slippage_cost =
                        quantity * (bar.open - price);

                    if (!std::isfinite(slippage_cost) ||
                        slippage_cost < 0.0) {
                        throw std::overflow_error(
                            "Invalid SELL slippage cost"
                        );
                    }

                    cash = proceeds - commission;
                    shares = 0.0;

                    result.trades.push_back({
                        i, bar.timestamp, Signal::Sell,
                        price, quantity,
                        commission, slippage_cost
                    });
                }
            }
        }

        // Value open positions using the current closing price.
        const double equity = cash + shares * bar.close;

        if (!std::isfinite(cash) ||
            !std::isfinite(shares) ||
            !std::isfinite(equity) ||
            cash < 0.0 ||
            shares < 0.0) {
            throw std::overflow_error(
                "Invalid portfolio accounting result"
            );
        }

        result.equity_curve.push_back({
            i, bar.timestamp, cash, shares, equity
        });
    }

    // Aggregate recorded costs after successful replay.
    // This keeps the summary consistent with executed fills.
    for (const auto& trade : result.trades) {
        result.total_commission += trade.commission_paid;
        result.total_slippage_cost += trade.slippage_cost;

        if (!std::isfinite(result.total_commission) ||
            !std::isfinite(result.total_slippage_cost)) {
            throw std::overflow_error(
                "Non-finite total execution costs"
            );
        }
    }

    result.final_equity =
        result.equity_curve.empty()
            ? initial_capital
            : result.equity_curve.back().equity;

    result.total_return_pct =
        (result.final_equity / initial_capital - 1.0) * 100.0;

    if (!std::isfinite(result.total_return_pct)) {
        throw std::overflow_error(
            "Non-finite portfolio return"
        );
    }

    return result;
}

} // namespace atlas
