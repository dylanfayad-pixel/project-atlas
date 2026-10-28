#include "atlas/portfolio_simulator.hpp"
#include "atlas/market_bar_validator.hpp"

#include <algorithm>
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
        config.slippage_bps >= 10000.0 ||
        !std::isfinite(config.max_entry_allocation) ||
        config.max_entry_allocation < 0.0 ||
        config.max_entry_allocation > 1.0 ||
        !std::isfinite(config.max_entry_exposure) ||
        config.max_entry_exposure < 0.0 ||
        config.max_entry_exposure > 1.0 ||
        !std::isfinite(config.max_drawdown_fraction) ||
        config.max_drawdown_fraction <= 0.0 ||
        config.max_drawdown_fraction > 1.0) {
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

    // Drawdown safeguards observe closing equity only.
    // A breach cannot affect execution until the next bar.
    double peak_equity = initial_capital;
    bool drawdown_halted = false;

    for (std::size_t i = 0; i < bars.size(); ++i) {
        const auto& bar = bars[i];

        // Signals generated at the previous close become
        // eligible for execution at this bar's opening price.
        if (i > 0) {
            const Signal pending = signals[i - 1].signal;

            if (pending == Signal::Buy && shares == 0.0 &&
                !drawdown_halted &&
                config.max_entry_allocation > 0.0 &&
                config.max_entry_exposure > 0.0 &&
                cash > commission) {

                // Both constraints are evaluated at the
                // next bar's opening reference price.
                const double allocation_budget =
                    cash * config.max_entry_allocation;

                const double fill_price =
                    bar.open * (1.0 + slip);

                if (!std::isfinite(allocation_budget) ||
                    !std::isfinite(fill_price) ||
                    fill_price <= 0.0) {
                    throw std::overflow_error(
                        "Invalid entry sizing arithmetic"
                    );
                }

                if (allocation_budget > commission) {
                    // Commission is part of the allocated budget.
                    const double allocation_quantity =
                        (allocation_budget - commission) /
                        fill_price;

                    // Entry exposure uses post-trade equity
                    // marked at the unadjusted opening price.
                    const double exposure_denominator =
                        bar.open +
                        config.max_entry_exposure *
                        (fill_price - bar.open);

                    const double exposure_quantity =
                        config.max_entry_exposure *
                        (cash - commission) /
                        exposure_denominator;

                    const double quantity = std::min(
                        allocation_quantity,
                        exposure_quantity
                    );

                    if (!std::isfinite(quantity) ||
                        !std::isfinite(exposure_denominator) ||
                        exposure_denominator <= 0.0 ||
                        quantity <= 0.0) {
                        throw std::overflow_error(
                            "Invalid entry exposure quantity"
                        );
                    }

                    const double cost = quantity * fill_price;

                    if (!std::isfinite(cost)) {
                        throw std::overflow_error(
                            "Non-finite BUY cost"
                        );
                    }

                    double remaining =
                        cash - cost - commission;

                    if (!std::isfinite(remaining)) {
                        throw std::overflow_error(
                            "Non-finite remaining cash"
                        );
                    }

                    const double tolerance = 1e-12 * cash;

                    if (remaining < -tolerance) {
                        throw std::overflow_error(
                            "BUY exceeded available cash"
                        );
                    }

                    if (remaining < 0.0) {
                        remaining = 0.0;
                    }

                    const double slippage_cost =
                        quantity * (fill_price - bar.open);

                    if (!std::isfinite(slippage_cost) ||
                        slippage_cost < 0.0) {
                        throw std::overflow_error(
                            "Invalid BUY slippage cost"
                        );
                    }

                    // Verify exposure using the actual
                    // post-trade cash and opening market value.
                    const double market_value =
                        quantity * bar.open;

                    const double entry_equity =
                        remaining + market_value;

                    if (!std::isfinite(market_value) ||
                        !std::isfinite(entry_equity) ||
                        entry_equity <= 0.0) {
                        throw std::overflow_error(
                            "Invalid post-trade equity"
                        );
                    }

                    const double exposure =
                        market_value / entry_equity;

                    if (!std::isfinite(exposure) ||
                        exposure >
                            config.max_entry_exposure + 1e-12) {
                        throw std::overflow_error(
                            "Entry exposure limit exceeded"
                        );
                    }

                    shares = quantity;
                    cash = remaining;

                    result.trades.push_back({
                        i, bar.timestamp, Signal::Buy,
                        fill_price, quantity,
                        commission, slippage_cost
                    });
                }
            } else if (
                shares > 0.0 &&
                (pending == Signal::Sell ||
                 (drawdown_halted &&
                  config.liquidate_on_drawdown))
            ) {

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

                    // Preserve uninvested cash when closing
                    // a partially allocated position.
                    const double updated_cash =
                        cash + (proceeds - commission);

                    if (!std::isfinite(updated_cash)) {
                        throw std::overflow_error(
                            "Non-finite SELL cash balance"
                        );
                    }

                    cash = updated_cash;
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

        // Observe the completed bar before changing risk state.
        // Future execution may react, but this bar cannot.
        peak_equity = std::max(peak_equity, equity);

        if (config.max_drawdown_fraction < 1.0 &&
            !drawdown_halted) {

            const double drawdown =
                (peak_equity - equity) / peak_equity;

            if (!std::isfinite(drawdown)) {
                throw std::overflow_error(
                    "Non-finite portfolio drawdown"
                );
            }

            if (drawdown >= config.max_drawdown_fraction) {
                drawdown_halted = true;
            }
        }
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
