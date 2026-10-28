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

    require(rejected, "Invalid exposure configuration accepted");
}

} // namespace

int main() {
    try {
        using atlas::MarketBar;
        using atlas::Signal;
        using atlas::SignalEvent;
        using atlas::ExecutionConfig;
        using atlas::PortfolioSimulator;

        const std::vector<MarketBar> bars{
            {"Day 1", 100, 100, 100, 100, 1000},
            {"Day 2", 100, 100, 100, 100, 1000},
            {"Day 3", 110, 110, 110, 110, 1000}
        };

        const std::vector<SignalEvent> signals{
            {0, "Day 1", Signal::Buy},
            {1, "Day 2", Signal::Sell},
            {2, "Day 3", Signal::Hold}
        };

        // Test exposure constraints with execution costs.
        for (const double limit :
             {0.10, 0.25, 0.50, 1.0}) {

            ExecutionConfig config{};
            config.max_entry_allocation = 1.0;
            config.max_entry_exposure = limit;
            config.commission_per_trade = 5.0;
            config.slippage_bps = 10.0;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Expected BUY and SELL fills");

            const auto& buy = result.trades[0];
            const auto& after_buy = result.equity_curve[1];

            const double market_value =
                after_buy.shares * bars[1].open;

            const double entry_equity =
                after_buy.cash + market_value;

            const double exposure =
                market_value / entry_equity;

            require(
                exposure <= limit + 1e-10,
                "Entry exposure limit exceeded"
            );

            require(
                near(exposure, limit),
                "Exposure limit did not bind correctly"
            );

            require(
                near(result.trades[1].quantity, buy.quantity),
                "SELL did not liquidate full position"
            );

            require(
                near(result.equity_curve[2].shares, 0.0),
                "Position remained open after SELL"
            );

            require(
                near(result.final_equity,
                     result.equity_curve[2].cash),
                "Final equity and cash disagree"
            );

            require(
                near(result.total_commission, 10.0),
                "Incorrect aggregate commission"
            );
        }

        // A stricter allocation limit must override
        // a looser exposure limit.
        {
            ExecutionConfig config{};
            config.max_entry_allocation = 0.10;
            config.max_entry_exposure = 0.50;
            config.commission_per_trade = 5.0;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            const double expected_quantity =
                (1000.0 - 5.0) / 100.0;

            require(
                near(result.trades[0].quantity,
                     expected_quantity),
                "Allocation limit was not enforced"
            );
        }

        // A zero exposure limit prevents opening positions.
        {
            ExecutionConfig config{};
            config.max_entry_exposure = 0.0;
            config.commission_per_trade = 5.0;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.empty(),
                    "Zero exposure created a trade");

            require(result.equity_curve.size() == bars.size(),
                    "Zero exposure lost equity observations");

            require(near(result.final_equity, 10000.0),
                    "Zero exposure changed equity");
        }

        // Reject invalid exposure limits before simulation.
        for (const double invalid :
             {-0.01, 1.01,
              std::numeric_limits<double>::infinity(),
              std::numeric_limits<double>::quiet_NaN()}) {

            ExecutionConfig config{};
            config.max_entry_exposure = invalid;

            expect_invalid([&] {
                (void)PortfolioSimulator::run(
                    bars, signals, 10000.0, config
                );
            });
        }

        // Entry exposure is enforced at the fill, but
        // subsequent market appreciation may increase it.
        // Atlas must not invent an automatic rebalance.
        {
            const std::vector<MarketBar> rising_bars{
                {"Day 1", 100, 100, 100, 100, 1000},
                {"Day 2", 100, 100, 100, 100, 1000},
                {"Day 3", 200, 200, 200, 200, 1000}
            };

            const std::vector<SignalEvent> hold_signals{
                {0, "Day 1", Signal::Buy},
                {1, "Day 2", Signal::Hold},
                {2, "Day 3", Signal::Hold}
            };

            ExecutionConfig config{};
            config.max_entry_exposure = 0.25;

            const auto result = PortfolioSimulator::run(
                rising_bars, hold_signals, 10000.0, config
            );

            require(result.trades.size() == 1,
                    "Unexpected automatic rebalance");

            const auto& entry = result.equity_curve[1];
            const auto& later = result.equity_curve[2];

            const double entry_exposure =
                entry.shares * rising_bars[1].close /
                entry.equity;

            const double later_exposure =
                later.shares * rising_bars[2].close /
                later.equity;

            require(
                near(entry_exposure, 0.25),
                "Initial exposure was incorrect"
            );

            require(
                later_exposure > 0.25,
                "Appreciation did not increase exposure"
            );

            require(
                near(entry.shares, later.shares),
                "Position changed without a SELL signal"
            );

            require(
                near(entry.cash, later.cash),
                "Cash changed without a trade"
            );
        }


        // At full allocation and exposure, the simulator
        // must never spend more cash than is available.
        {
            ExecutionConfig config{};
            config.max_entry_allocation = 1.0;
            config.max_entry_exposure = 1.0;
            config.commission_per_trade = 5.0;
            config.slippage_bps = 9999.0;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(!result.trades.empty(),
                    "Full allocation unexpectedly skipped BUY");

            const auto& buy = result.trades.front();
            const auto& point = result.equity_curve[1];

            require(point.cash >= 0.0,
                    "Full allocation created negative cash");

            require(
                buy.quantity * buy.price +
                buy.commission_paid <= 10000.0 + 1e-8,
                "Full allocation exceeded available capital"
            );

            const double market_value =
                point.shares * bars[1].open;

            require(
                market_value / (point.cash + market_value)
                    <= 1.0 + 1e-12,
                "Full allocation exceeded exposure limit"
            );
        }

        // Zero execution costs should preserve the
        // intuitive quantity and exposure relationship.
        {
            ExecutionConfig config{};
            config.max_entry_allocation = 1.0;
            config.max_entry_exposure = 0.25;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(
                near(result.trades[0].quantity, 25.0),
                "Zero-cost exposure sizing incorrect"
            );

            require(
                near(result.equity_curve[1].cash, 7500.0),
                "Zero-cost residual cash incorrect"
            );
        }

        // A very small positive exposure must not
        // accidentally create a negative cash balance.
        {
            ExecutionConfig config{};
            config.max_entry_exposure = 1e-6;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Small positive exposure skipped fills");

            require(
                result.equity_curve[1].cash >= 0.0,
                "Small exposure produced negative cash"
            );
        }

        std::cout << "Exposure limit tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Exposure limit test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
