#include "atlas/portfolio_simulator.hpp"

#include <algorithm>
#include <cmath>
#include <iostream>
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

} // namespace

int main() {
    try {
        using atlas::ExecutionConfig;
        using atlas::MarketBar;
        using atlas::PortfolioSimulator;
        using atlas::RiskEventType;
        using atlas::Signal;
        using atlas::SignalEvent;

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

        // A breach at Day 3 close must precede
        // the successful liquidation at Day 4 open.
        {
            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.risk_events.size() == 2,
                    "Expected breach and liquidation events");

            const auto& breach = result.risk_events[0];
            const auto& liquidation = result.risk_events[1];

            require(
                breach.type == RiskEventType::DrawdownBreach,
                "First event must be a drawdown breach"
            );

            require(breach.index == 2 &&
                    breach.timestamp == "Day 3",
                    "Breach timestamp incorrect");

            require(near(breach.drawdown_fraction, 0.20),
                    "Breach drawdown incorrect");

            require(
                liquidation.type ==
                    RiskEventType::LiquidationExecuted,
                "Second event must be successful liquidation"
            );

            require(liquidation.index == 3 &&
                    liquidation.timestamp == "Day 4",
                    "Liquidation event timestamp incorrect");

            require(result.trades.size() == 2,
                    "Expected BUY and SELL fills");
        }

        // When automatic liquidation is disabled,
        // only the drawdown breach should be recorded.
        {
            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.risk_events.size() == 1,
                    "Unexpected liquidation event");

            require(
                result.risk_events[0].type ==
                    RiskEventType::DrawdownBreach,
                "Incorrect breach-only event");
        }

        // A breach on the final bar cannot create
        // an execution event on a nonexistent bar.
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

            require(result.risk_events.size() == 1,
                    "Final-bar breach created future event");

            require(
                result.risk_events[0].type ==
                    RiskEventType::DrawdownBreach,
                "Final-bar event type incorrect"
            );
        }

        // A rejected risk liquidation must not be
        // reported as an executed SELL.
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
                costly_bars, costly_signals, 10000.0, config
            );

            require(result.risk_events.size() == 2,
                    "Expected breach and rejection");

            require(
                result.risk_events[1].type ==
                    RiskEventType::LiquidationRejected,
                "Rejected liquidation misclassified"
            );

            require(result.trades.size() == 1,
                    "Rejected liquidation created a fill");

            require(result.equity_curve.back().shares > 0.0,
                    "Rejected liquidation erased position");
        }

        // Ordinary strategy SELLs must not be classified
        // as forced liquidation when that policy is disabled.
        {
            auto exit_signals = signals;
            exit_signals[2].signal = Signal::Sell;

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = false;

            const auto result = PortfolioSimulator::run(
                bars, exit_signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Ordinary strategy SELL missing");

            require(result.risk_events.size() == 1,
                    "Ordinary SELL mislabeled as risk liquidation");
        }

        // Default execution must not emit risk events.
        {
            const auto result = PortfolioSimulator::run(
                bars, signals
            );

            require(result.risk_events.empty(),
                    "Disabled safeguard emitted risk events");
        }


        // A rejected liquidation is retried on later bars.
        // Rejections do not create fills or charge fees.
        {
            const std::vector<MarketBar> retry_bars{
                {"Day 1", 100, 100, 100, 100, 1000},
                {"Day 2", 100, 100, 100, 100, 1000},
                {"Day 3", 80, 80, 80, 80, 1000},
                {"Day 4", 0.01, 0.01, 0.01, 0.01, 1000},
                {"Day 5", 0.02, 0.02, 0.02, 0.02, 1000},
                {"Day 6", 70, 70, 70, 70, 1000}
            };

            const std::vector<SignalEvent> retry_signals{
                {0, "Day 1", Signal::Buy},
                {1, "Day 2", Signal::Hold},
                {2, "Day 3", Signal::Hold},
                {3, "Day 4", Signal::Hold},
                {4, "Day 5", Signal::Hold},
                {5, "Day 6", Signal::Hold}
            };

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;
            config.commission_per_trade = 5.0;

            const auto result = PortfolioSimulator::run(
                retry_bars, retry_signals, 10000.0, config
            );

            require(result.risk_events.size() == 4,
                    "Incorrect liquidation retry event count");

            require(
                result.risk_events[0].type ==
                    RiskEventType::DrawdownBreach,
                "Missing initial breach"
            );

            require(
                result.risk_events[1].type ==
                    RiskEventType::LiquidationRejected &&
                result.risk_events[1].index == 3,
                "First rejected liquidation incorrect"
            );

            require(
                result.risk_events[2].type ==
                    RiskEventType::LiquidationRejected &&
                result.risk_events[2].index == 4,
                "Second rejected liquidation incorrect"
            );

            require(
                result.risk_events[3].type ==
                    RiskEventType::LiquidationExecuted &&
                result.risk_events[3].index == 5,
                "Successful retry event incorrect"
            );

            require(result.trades.size() == 2,
                    "Rejected attempts created trade fills");

            require(near(result.total_commission, 10.0),
                    "Rejected attempts charged commissions");
        }


        // A simultaneous strategy SELL and risk liquidation
        // must create only one fill and one risk outcome.
        {
            auto simultaneous_signals = signals;
            simultaneous_signals[2].signal = Signal::Sell;

            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;

            const auto result = PortfolioSimulator::run(
                bars, simultaneous_signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Simultaneous exits created duplicate fills");

            require(result.risk_events.size() == 2,
                    "Simultaneous exit event count incorrect");

            require(
                result.risk_events[1].type ==
                    RiskEventType::LiquidationExecuted,
                "Risk liquidation priority not preserved"
            );

            require(
                result.risk_events[1].timestamp == "Day 4",
                "Simultaneous exit timestamp incorrect"
            );
        }


        // Events must remain chronological and liquidation
        // outcomes must follow a previously observed breach.
        {
            ExecutionConfig config{};
            config.max_drawdown_fraction = 0.20;
            config.liquidate_on_drawdown = true;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            bool observed_breach = false;
            std::size_t previous_index = 0;

            for (const auto& event : result.risk_events) {
                require(event.index >= previous_index,
                        "Risk events are not chronological");

                require(event.index < bars.size(),
                        "Risk event index out of bounds");

                require(event.timestamp ==
                        bars[event.index].timestamp,
                        "Risk event timestamp mismatch");

                if (event.type == RiskEventType::DrawdownBreach) {
                    require(!observed_breach,
                            "Duplicate breach event");
                    observed_breach = true;
                } else {
                    require(observed_breach,
                            "Liquidation event preceded breach");
                }

                previous_index = event.index;
            }
        }

        std::cout << "Risk-event tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Risk-event test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
