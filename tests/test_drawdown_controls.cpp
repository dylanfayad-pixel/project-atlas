#include "atlas/portfolio_simulator.hpp"

#include <algorithm>
#include <cmath>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <vector>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

bool near(double actual, double expected) {
    return std::abs(actual - expected) <=
        1e-9 * std::max(1.0, std::abs(expected));
}

template <typename Function>
void expect_invalid(Function operation) {
    bool rejected = false;

    try {
        operation();
    } catch (const std::invalid_argument&) {
        rejected = true;
    }

    require(rejected, "Invalid drawdown configuration accepted");
}

} // namespace

int main() {
    try {
        using atlas::MarketBar;
        using atlas::Signal;
        using atlas::SignalEvent;
        using atlas::ExecutionConfig;
        using atlas::PortfolioSimulator;

        // The position loses 20% by Day 3 close.
        // A forced SELL can execute no earlier than Day 4.
        const std::vector<MarketBar> bars{
            {"Day 1", 100, 100, 100, 100, 1000},
            {"Day 2", 100, 100, 100, 100, 1000},
            {"Day 3", 80, 80, 80, 80, 1000},
            {"Day 4", 70, 70, 70, 70, 1000},
            {"Day 5", 120, 120, 120, 120, 1000}
        };

        const std::vector<SignalEvent> signals{
            {0, "Day 1", Signal::Buy},
            {1, "Day 2", Signal::Hold},
            {2, "Day 3", Signal::Hold},
            {3, "Day 4", Signal::Buy},
            {4, "Day 5", Signal::Hold}
        };

        // Drawdown-triggered liquidation occurs at the
        // next bar's open, never on the breach bar.
        {
            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Expected BUY and forced SELL");

            require(result.trades[0].side == Signal::Buy,
                    "First fill must be BUY");

            require(result.trades[1].side == Signal::Sell,
                    "Second fill must be SELL");

            require(result.trades[1].timestamp == "Day 4",
                    "Liquidation executed at wrong time");

            require(near(result.trades[1].price, 70.0),
                    "Liquidation used wrong opening price");

            require(near(result.final_equity, 7000.0),
                    "Incorrect forced liquidation equity");

            require(result.equity_curve.size() == bars.size(),
                    "Liquidation lost equity observations");
        }

        // Without liquidation, a breached position remains
        // open until an ordinary strategy SELL arrives.
        {
            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = false;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.size() == 1,
                    "Unexpected forced liquidation");

            require(result.equity_curve.back().shares > 0.0,
                    "Position was liquidated unexpectedly");
        }

        // A breach on the last bar cannot create a fill
        // because no subsequent opening price exists.
        {
            const std::vector<MarketBar> short_bars{
                bars[0], bars[1], bars[2]
            };

            const std::vector<SignalEvent> short_signals{
                signals[0], signals[1], signals[2]
            };

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;

            const auto result = PortfolioSimulator::run(
                short_bars, short_signals, 10000.0, config
            );

            require(result.trades.size() == 1,
                    "Final-bar breach created future fill");

            require(near(result.final_equity, 8000.0),
                    "Incorrect final-bar equity");
        }

        // Invalid thresholds must be rejected.
        for (const double invalid :
             {-0.1, 0.0, 1.01,
              std::numeric_limits<double>::infinity(),
              std::numeric_limits<double>::quiet_NaN()}) {

            ExecutionConfig config{};
            config.max_drawdown_fraction = invalid;

            expect_invalid([&] {
                (void)PortfolioSimulator::run(
                    bars, signals, 10000.0, config
                );
            });
        }

        // Default configuration must not activate
        // drawdown-based trading restrictions.
        {
            ExecutionConfig config{};

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.size() == 1,
                    "Default configuration changed fills");
        }


        // Once activated, the circuit breaker remains latched.
        // A later recovery must not permit a new BUY.
        {
            const std::vector<MarketBar> recovery_bars{
                {"Day 1", 100, 100, 100, 100, 1000},
                {"Day 2", 100, 100, 100, 100, 1000},
                {"Day 3", 80, 80, 80, 80, 1000},
                {"Day 4", 70, 70, 70, 70, 1000},
                {"Day 5", 120, 120, 120, 120, 1000},
                {"Day 6", 120, 120, 120, 120, 1000}
            };

            const std::vector<SignalEvent> recovery_signals{
                {0, "Day 1", Signal::Buy},
                {1, "Day 2", Signal::Hold},
                {2, "Day 3", Signal::Hold},
                {3, "Day 4", Signal::Buy},
                {4, "Day 5", Signal::Buy},
                {5, "Day 6", Signal::Hold}
            };

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;

            const auto result = PortfolioSimulator::run(
                recovery_bars, recovery_signals,
                10000.0, config
            );

            require(result.trades.size() == 2,
                    "Circuit breaker permitted a new entry");

            require(result.trades[0].side == Signal::Buy,
                    "Expected initial BUY");

            require(result.trades[1].side == Signal::Sell,
                    "Expected forced liquidation");

            require(result.trades[1].timestamp == "Day 4",
                    "Forced liquidation occurred too early");

            require(
                near(result.equity_curve.back().shares, 0.0),
                "Circuit breaker reopened a position"
            );

            require(
                near(result.final_equity, 7000.0),
                "Circuit breaker changed final cash"
            );
        }


        // Forced liquidation must use the existing
        // commission- and slippage-aware SELL path.
        {
            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;
            config.commission_per_trade = 5.0;
            config.slippage_bps = 10.0;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Cost-aware liquidation missing fills");

            const auto& buy = result.trades[0];
            const auto& sell = result.trades[1];

            require(sell.side == Signal::Sell,
                    "Forced liquidation side incorrect");

            require(sell.timestamp == "Day 4",
                    "Cost-aware liquidation timing incorrect");

            const double expected_sell_price =
                70.0 * (1.0 - 0.001);

            require(
                near(sell.price, expected_sell_price),
                "Forced SELL slippage incorrect"
            );

            require(
                near(result.total_commission, 10.0),
                "Forced liquidation commissions incorrect"
            );

            require(
                near(result.final_equity,
                     result.equity_curve.back().cash),
                "Forced liquidation cash reconciliation failed"
            );

            require(
                near(result.equity_curve.back().shares, 0.0),
                "Forced liquidation left an open position"
            );

            require(
                buy.quantity == sell.quantity,
                "Forced liquidation quantity mismatch"
            );
        }


        // A 19% drawdown must not trigger a 20% breaker.
        // A 20% drawdown must trigger next-bar liquidation.
        for (const double breach_close : {81.0, 80.0}) {
            const std::vector<MarketBar> boundary_bars{
                {"Day 1", 100, 100, 100, 100, 1000},
                {"Day 2", 100, 100, 100, 100, 1000},
                {"Day 3", breach_close, breach_close,
                 breach_close, breach_close, 1000},
                {"Day 4", 70, 70, 70, 70, 1000}
            };

            const std::vector<SignalEvent> boundary_signals{
                {0, "Day 1", Signal::Buy},
                {1, "Day 2", Signal::Hold},
                {2, "Day 3", Signal::Hold},
                {3, "Day 4", Signal::Hold}
            };

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;

            const auto result = PortfolioSimulator::run(
                boundary_bars, boundary_signals,
                10000.0, config
            );

            if (breach_close == 81.0) {
                require(result.trades.size() == 1,
                        "Below-threshold drawdown liquidated");
            } else {
                require(result.trades.size() == 2,
                        "Exact-threshold drawdown not detected");

                require(
                    result.trades[1].timestamp == "Day 4",
                    "Threshold liquidation timing incorrect"
                );
            }
        }


        // A price gap can produce losses beyond the
        // configured drawdown threshold.
        {
            const std::vector<MarketBar> gap_bars{
                {"Day 1", 100, 100, 100, 100, 1000},
                {"Day 2", 100, 100, 100, 100, 1000},
                {"Day 3", 80, 80, 80, 80, 1000},
                {"Day 4", 50, 50, 50, 50, 1000}
            };

            const std::vector<SignalEvent> gap_signals{
                {0, "Day 1", Signal::Buy},
                {1, "Day 2", Signal::Hold},
                {2, "Day 3", Signal::Hold},
                {3, "Day 4", Signal::Hold}
            };

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;

            const auto result = PortfolioSimulator::run(
                gap_bars, gap_signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Gap scenario missing liquidation");

            require(
                near(result.trades[1].price, 50.0),
                "Gap liquidation used incorrect price"
            );

            require(
                near(result.final_equity, 5000.0),
                "Gap liquidation equity incorrect"
            );

            require(
                result.total_return_pct < -20.0,
                "Gap risk was incorrectly capped"
            );
        }


        // A forced liquidation that cannot cover commission
        // must not create a fill or erase the open position.
        {
            const std::vector<MarketBar> costly_bars{
                {"Day 1", 100, 100, 100, 100, 1000},
                {"Day 2", 100, 100, 100, 100, 1000},
                {"Day 3", 80, 80, 80, 80, 1000},
                {"Day 4", 0.01, 0.01, 0.01, 0.01, 1000}
            };

            const std::vector<SignalEvent> costly_signals{
                {0, "Day 1", Signal::Buy},
                {1, "Day 2", Signal::Hold},
                {2, "Day 3", Signal::Hold},
                {3, "Day 4", Signal::Hold}
            };

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;
            config.commission_per_trade = 5.0;

            const auto result = PortfolioSimulator::run(
                costly_bars, costly_signals,
                10000.0, config
            );

            require(result.trades.size() == 1,
                    "Unaffordable liquidation created a fill");

            require(result.equity_curve.back().shares > 0.0,
                    "Rejected liquidation erased shares");

            require(
                near(result.total_commission, 5.0),
                "Rejected liquidation charged commission"
            );

            require(
                near(result.final_equity,
                     result.equity_curve.back().equity),
                "Rejected liquidation equity mismatch"
            );
        }


        // A circuit breaker blocks new BUY signals,
        // but must not block ordinary strategy exits.
        {
            const std::vector<SignalEvent> exit_signals{
                {0, "Day 1", Signal::Buy},
                {1, "Day 2", Signal::Hold},
                {2, "Day 3", Signal::Sell},
                {3, "Day 4", Signal::Buy},
                {4, "Day 5", Signal::Hold}
            };

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = false;

            const auto result = PortfolioSimulator::run(
                bars, exit_signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Strategy SELL or BUY restriction incorrect");

            require(result.trades[1].side == Signal::Sell,
                    "Strategy exit was not executed");

            require(result.trades[1].timestamp == "Day 4",
                    "Strategy exit timing incorrect");

            require(
                near(result.equity_curve.back().shares, 0.0),
                "Strategy exit left position open"
            );
        }

        std::cout << "Drawdown control tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Drawdown control test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
