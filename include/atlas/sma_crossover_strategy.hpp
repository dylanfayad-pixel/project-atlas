#pragma once

#include "atlas/strategy.hpp"

#include <cstddef>
#include <deque>
#include <stdexcept>

namespace atlas {

// Simple Moving Average (SMA) crossover strategy.
// Compares a short-term average with a long-term average.
class SmaCrossoverStrategy final : public Strategy {
public:
    // The fast window must be shorter than the slow window.
    SmaCrossoverStrategy(
        std::size_t fast_period,
        std::size_t slow_period
    )
        : fast_period_(fast_period),
          slow_period_(slow_period) {
        if (fast_period == 0 ||
            fast_period >= slow_period) {
            throw std::invalid_argument(
                "Require 0 < fast_period < slow_period"
            );
        }
    }

    // Clear all previous prices before a new simulation.
    void reset() override {
        prices_.clear();
        previous_above_ = false;
        initialized_ = false;
    }

    // Process one closing price at a time.
    // Future market bars are never supplied to this method.
    Signal on_bar(const MarketBar& bar) override {
        prices_.push_back(bar.close);

        // Keep only the most recent slow_period prices.
        if (prices_.size() > slow_period_) {
            prices_.pop_front();
        }

        // Both averages require sufficient price history.
        if (prices_.size() < slow_period_) {
            return Signal::Hold;
        }

        double fast_sum = 0.0;
        double slow_sum = 0.0;

        for (std::size_t i = 0; i < prices_.size(); ++i) {
            slow_sum += prices_[i];

            if (i >= prices_.size() - fast_period_) {
                fast_sum += prices_[i];
            }
        }

        const double fast_average =
            fast_sum / static_cast<double>(fast_period_);

        const double slow_average =
            slow_sum / static_cast<double>(slow_period_);

        const bool above = fast_average > slow_average;

        // Establish the initial relationship without trading.
        if (!initialized_) {
            previous_above_ = above;
            initialized_ = true;
            return Signal::Hold;
        }

        Signal signal = Signal::Hold;

        if (above && !previous_above_) {
            signal = Signal::Buy;
        } else if (!above && previous_above_) {
            signal = Signal::Sell;
        }

        previous_above_ = above;
        return signal;
    }

private:
    std::size_t fast_period_;
    std::size_t slow_period_;

    // Rolling window containing only recent closing prices.
    std::deque<double> prices_;

    bool previous_above_ = false;
    bool initialized_ = false;
};

} // namespace atlas
