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
        1e-8 * std::max(1.0, std::abs(expected));
}

template <typename Function>
void expect_invalid(Function operation) {
    bool rejected = false;

    try {
        operation();
    } catch (const std::invalid_argument&) {
        rejected = true;
    }

    require(rejected, "Invalid configuration was accepted");
}

} // namespace

int main() {
    try {
        using namespace atlas;

        // BUY on Day 1 executes at Day 2's open.
        // SELL on Day 2 executes at Day 3's open.
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

        // Verify the original zero-cost behavior.
        const auto baseline = PortfolioSimulator::run(
            bars, signals, 1000.0
        );

        require(near(baseline.final_equity, 1100.0),
                "Zero-cost baseline changed");

        require(baseline.trades.size() == 2,
                "Expected two baseline fills");

        // Model $5 per fill and 10 bps adverse slippage.
        ExecutionConfig costs{};
        costs.commission_per_trade = 5.0;
        costs.slippage_bps = 10.0;

        const auto result = PortfolioSimulator::run(
            bars, signals, 1000.0, costs
        );

        const double buy_price = 100.0 * 1.001;
        const double sell_price = 110.0 * 0.999;
        const double expected_shares = 995.0 / buy_price;
        const double expected_equity =
            expected_shares * sell_price - 5.0;

        require(result.trades.size() == 2,
                "Expected two cost-adjusted fills");

        require(near(result.trades[0].price, buy_price),
                "Incorrect slippage-adjusted BUY price");

        require(near(result.trades[1].price, sell_price),
                "Incorrect slippage-adjusted SELL price");

        require(near(result.trades[0].quantity, expected_shares),
                "Incorrect fee-adjusted BUY quantity");

        require(near(result.final_equity, expected_equity),
                "Incorrect cost-adjusted final equity");

        require(result.final_equity < baseline.final_equity,
                "Trading costs did not reduce returns");

        require(near(result.equity_curve[1].shares, expected_shares),
                "BUY position accounting incorrect");

        require(result.equity_curve[1].cash >= 0.0,
                "BUY produced negative cash");

        require(near(result.equity_curve[2].shares, 0.0),
                "SELL failed to close position");

        require(near(result.equity_curve[2].cash, expected_equity),
                "SELL cash accounting incorrect");

        // Insufficient cash must not generate a BUY fill.
        ExecutionConfig expensive{};
        expensive.commission_per_trade = 1000.0;

        const auto skipped = PortfolioSimulator::run(
            bars, signals, 1000.0, expensive
        );

        require(skipped.trades.empty(),
                "Unaffordable BUY should be skipped");

        require(near(skipped.final_equity, 1000.0),
                "Skipped trade changed portfolio equity");

        // A SELL whose proceeds cannot cover commission is skipped.
        const std::vector<MarketBar> falling{
            {"Day 1", 100, 100, 100, 100, 1000},
            {"Day 2", 100, 100, 100, 100, 1000},
            {"Day 3", 10, 10, 10, 10, 1000}
        };

        ExecutionConfig high_fee{};
        high_fee.commission_per_trade = 200.0;

        const auto unsold = PortfolioSimulator::run(
            falling, signals, 1000.0, high_fee
        );

        require(unsold.trades.size() == 1,
                "Unaffordable SELL should be skipped");

        require(unsold.equity_curve.back().shares > 0.0,
                "Skipped SELL incorrectly removed shares");

        require(near(unsold.final_equity, 80.0),
                "Skipped SELL mark-to-market incorrect");

        // Reject negative, non-finite, and impossible costs.
        ExecutionConfig invalid{};

        invalid.commission_per_trade = -1.0;
        expect_invalid([&] {
            (void)PortfolioSimulator::run(
                bars, signals, 1000.0, invalid
            );
        });

        invalid.commission_per_trade =
            std::numeric_limits<double>::quiet_NaN();
        expect_invalid([&] {
            (void)PortfolioSimulator::run(
                bars, signals, 1000.0, invalid
            );
        });

        invalid.commission_per_trade = 0.0;
        invalid.slippage_bps = -1.0;
        expect_invalid([&] {
            (void)PortfolioSimulator::run(
                bars, signals, 1000.0, invalid
            );
        });

        invalid.slippage_bps = 10000.0;
        expect_invalid([&] {
            (void)PortfolioSimulator::run(
                bars, signals, 1000.0, invalid
            );
        });

        // Both fills must expose their actual commission.
        require(near(result.trades[0].commission_paid, 5.0),
                "Incorrect BUY commission record");

        require(near(result.trades[1].commission_paid, 5.0),
                "Incorrect SELL commission record");

        // Adverse slippage is measured against the bar open.
        require(
            near(result.trades[0].slippage_cost,
                 expected_shares * (buy_price - 100.0)),
            "Incorrect BUY slippage cost"
        );

        require(
            near(result.trades[1].slippage_cost,
                 expected_shares * (110.0 - sell_price)),
            "Incorrect SELL slippage cost"
        );

        require(near(baseline.trades[0].commission_paid, 0.0),
                "Zero-cost BUY reported commission");

        require(near(baseline.trades[0].slippage_cost, 0.0),
                "Zero-cost BUY reported slippage");

        // Every recorded cost must be finite and non-negative.
        for (const auto& trade : result.trades) {
            require(std::isfinite(trade.commission_paid),
                    "Non-finite commission recorded");

            require(std::isfinite(trade.slippage_cost),
                    "Non-finite slippage recorded");

            require(trade.commission_paid >= 0.0,
                    "Negative commission recorded");

            require(trade.slippage_cost >= 0.0,
                    "Negative slippage recorded");
        }

        // Every equity observation must remain financially valid.
        for (const auto& point : result.equity_curve) {
            require(std::isfinite(point.cash),
                    "Non-finite cash balance");

            require(std::isfinite(point.shares),
                    "Non-finite position quantity");

            require(std::isfinite(point.equity),
                    "Non-finite equity observation");

            require(point.cash >= 0.0,
                    "Negative cash balance");

            require(point.shares >= 0.0,
                    "Negative share quantity");
        }

        // High but valid adverse slippage must not create
        // invalid accounting results.
        ExecutionConfig extreme{};
        extreme.slippage_bps = 9999.0;

        const auto extreme_result = PortfolioSimulator::run(
            bars, signals, 1000.0, extreme
        );

        require(std::isfinite(extreme_result.final_equity),
                "Extreme slippage produced non-finite equity");

        require(extreme_result.final_equity >= 0.0,
                "Extreme slippage produced negative equity");

        // Portfolio totals must equal the recorded fill costs.
        require(near(result.total_commission, 10.0),
                "Incorrect total commission");

        const double expected_slippage =
            result.trades[0].slippage_cost +
            result.trades[1].slippage_cost;

        require(
            near(result.total_slippage_cost, expected_slippage),
            "Incorrect total slippage"
        );

        require(near(baseline.total_commission, 0.0),
                "Baseline reported nonzero commission");

        require(near(baseline.total_slippage_cost, 0.0),
                "Baseline reported nonzero slippage");

        std::cout << "Execution cost tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Execution cost test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
