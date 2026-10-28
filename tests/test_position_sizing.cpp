#include "atlas/portfolio_simulator.hpp"

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

    require(rejected, "Invalid allocation was accepted");
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

        // Test multiple entry allocation percentages.
        for (const double allocation :
             {0.10, 0.25, 0.50, 1.0}) {

            ExecutionConfig config{};
            config.max_entry_allocation = allocation;
            config.commission_per_trade = 5.0;
            config.slippage_bps = 10.0;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.size() == 2,
                    "Expected BUY and SELL fills");

            const double buy_price = 100.1;
            const double sell_price = 109.89;
            const double allocated = 10000.0 * allocation;
            const double expected_quantity =
                (allocated - 5.0) / buy_price;

            const double expected_cash_after_buy =
                10000.0 - allocated;

            const double expected_final_cash =
                expected_cash_after_buy +
                expected_quantity * sell_price - 5.0;

            require(
                near(result.trades[0].quantity,
                     expected_quantity),
                "Incorrect allocated BUY quantity"
            );

            require(
                near(result.equity_curve[1].cash,
                     expected_cash_after_buy),
                "Incorrect residual cash after BUY"
            );

            if (!near(result.final_equity,
                      expected_final_cash)) {
                std::cerr
                    << "Allocation: " << allocation
                    << "\nExpected final equity: "
                    << expected_final_cash
                    << "\nActual final equity: "
                    << result.final_equity
                    << "\nBUY price: "
                    << result.trades[0].price
                    << "\nSELL price: "
                    << result.trades[1].price
                    << "\nBUY quantity: "
                    << result.trades[0].quantity
                    << "\nSELL quantity: "
                    << result.trades[1].quantity
                    << "\nCash after BUY: "
                    << result.equity_curve[1].cash
                    << "\nCash after SELL: "
                    << result.equity_curve[2].cash
                    << '\n';

                throw std::runtime_error(
                    "Incorrect final equity after SELL"
                );
            }

            // A SELL must add net proceeds to existing cash,
            // rather than replacing the uninvested balance.
            const double expected_sell_cash =
                result.equity_curve[1].cash +
                result.trades[1].quantity *
                result.trades[1].price -
                result.trades[1].commission_paid;

            require(
                near(result.equity_curve[2].cash,
                     expected_sell_cash),
                "SELL did not preserve uninvested cash"
            );

            require(
                near(result.equity_curve[2].shares, 0.0),
                "SELL failed to liquidate the position"
            );

            // Reconcile every recorded equity observation
            // with its cash and marked-to-market position.
            for (std::size_t i = 0;
                 i < result.equity_curve.size(); ++i) {

                const auto& point = result.equity_curve[i];

                const double expected_equity =
                    point.cash + point.shares * bars[i].close;

                require(
                    near(point.equity, expected_equity),
                    "Portfolio equity reconciliation failed"
                );

                require(
                    point.cash >= 0.0 && point.shares >= 0.0,
                    "Negative cash or share balance"
                );
            }

            // Aggregate costs must match individual fills.
            double commissions = 0.0;
            double slippage = 0.0;

            for (const auto& trade : result.trades) {
                commissions += trade.commission_paid;
                slippage += trade.slippage_cost;
            }

            require(
                near(result.total_commission, commissions),
                "Commission totals do not reconcile"
            );

            require(
                near(result.total_slippage_cost, slippage),
                "Slippage totals do not reconcile"
            );

            require(
                near(result.total_commission, 10.0),
                "Incorrect commission aggregation"
            );

            require(
                result.equity_curve.size() == bars.size(),
                "Equity curve lost observations"
            );
        }

        // Zero allocation must skip buying without fees.
        {
            ExecutionConfig config{};
            config.max_entry_allocation = 0.0;
            config.commission_per_trade = 5.0;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.empty(),
                    "Zero allocation executed a trade");

            require(near(result.final_equity, 10000.0),
                    "Zero allocation changed portfolio equity");

            require(result.equity_curve.size() == bars.size(),
                    "Zero allocation lost equity observations");
        }

        // An allocation that cannot cover commission
        // must not create a fill or skip an equity point.
        {
            ExecutionConfig config{};
            config.max_entry_allocation = 0.0001;
            config.commission_per_trade = 5.0;

            const auto result = PortfolioSimulator::run(
                bars, signals, 10000.0, config
            );

            require(result.trades.empty(),
                    "Unaffordable allocation executed a fill");

            require(result.equity_curve.size() == bars.size(),
                    "Unaffordable allocation lost observations");

            require(near(result.final_equity, 10000.0),
                    "Unaffordable allocation changed equity");
        }

        // Reject invalid allocation configurations.
        for (const double invalid :
             {-0.01, 1.01,
              std::numeric_limits<double>::infinity(),
              std::numeric_limits<double>::quiet_NaN()}) {

            ExecutionConfig config{};
            config.max_entry_allocation = invalid;

            expect_invalid([&] {
                (void)PortfolioSimulator::run(
                    bars, signals, 10000.0, config
                );
            });
        }

        // The default must match an explicit 100% allocation.
        {
            ExecutionConfig baseline{};
            ExecutionConfig explicit_full{};
            explicit_full.max_entry_allocation = 1.0;

            const auto a = PortfolioSimulator::run(
                bars, signals, 10000.0, baseline
            );

            const auto b = PortfolioSimulator::run(
                bars, signals, 10000.0, explicit_full
            );

            require(near(a.final_equity, b.final_equity),
                    "Default allocation changed behavior");

            require(a.trades.size() == b.trades.size(),
                    "Default allocation changed fill count");
        }

        std::cout << "Position sizing tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Position sizing test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
