#include "atlas/portfolio_simulator.hpp"
#include "atlas/market_bar_validator.hpp"

#include <cmath>
#include <stdexcept>

namespace atlas {

PortfolioResult PortfolioSimulator::run(
    const std::vector<MarketBar>& bars,
    const std::vector<SignalEvent>& signals,
    double initial_capital
) {
    // Reject invalid starting capital.
    if (!std::isfinite(initial_capital) ||
        initial_capital <= 0.0) {
        throw std::invalid_argument(
            "Initial capital must be positive and finite"
        );
    }

    if (bars.size() != signals.size()) {
        throw std::invalid_argument(
            "Market bars and signals must have equal lengths"
        );
    }

    // Validate the complete input before executing any trades.
    // The simulator accepts ordered synthetic labels as well
    // as calendar dates; calendar validation belongs to ingestion.
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

        // Reject repeated timestamps. Calendar chronology
        // remains the responsibility of the CSV reader.
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

    for (std::size_t i = 0; i < bars.size(); ++i) {
        const auto& bar = bars[i];
        const auto& event = signals[i];

        // Verify that the signal belongs to this market bar.
        if (event.index != i ||
            event.timestamp != bar.timestamp) {
            throw std::invalid_argument(
                "Signal and market bar alignment mismatch"
            );
        }

        // A trade decided at the previous close is eligible
        // for execution at the current bar's opening price.
        if (i > 0) {
            const Signal pending = signals[i - 1].signal;

            if (pending == Signal::Buy && shares == 0.0) {
                shares = cash / bar.open;
                cash = 0.0;

                result.trades.push_back({
                    i,
                    bar.timestamp,
                    Signal::Buy,
                    bar.open,
                    shares
                });
            } else if (pending == Signal::Sell &&
                       shares > 0.0) {
                const double quantity = shares;

                cash = shares * bar.open;
                shares = 0.0;

                result.trades.push_back({
                    i,
                    bar.timestamp,
                    Signal::Sell,
                    bar.open,
                    quantity
                });
            }
        }

        // Mark open positions to the current closing price.
        const double equity = cash + shares * bar.close;

        // Detect arithmetic overflow before recording results.
        if (!std::isfinite(cash) ||
            !std::isfinite(shares) ||
            !std::isfinite(equity)) {
            throw std::overflow_error(
                "Non-finite portfolio accounting result"
            );
        }

        result.equity_curve.push_back({
            i,
            bar.timestamp,
            cash,
            shares,
            equity
        });
    }

    // An open position remains marked to market; it is not
    // automatically liquidated on the final historical bar.
    result.final_equity =
        result.equity_curve.empty()
            ? initial_capital
            : result.equity_curve.back().equity;

    result.total_return_pct =
        (result.final_equity / initial_capital - 1.0) * 100.0;

    // Extreme but finite inputs can overflow the return formula.
    if (!std::isfinite(result.total_return_pct)) {
        throw std::overflow_error(
            "Non-finite portfolio return"
        );
    }

    return result;
}

} // namespace atlas
