#pragma once

#include "atlas/strategy.hpp"

namespace atlas {

// Example strategy that issues one Buy signal.
// Subsequent market bars produce Hold signals.
class BuyAndHoldStrategy final : public Strategy {
public:
    // Restore the strategy to its initial state.
    void reset() override {
        has_bought_ = false;
    }

    // Generate a Buy signal once, then Hold.
    Signal on_bar(const MarketBar&) override {
        if (!has_bought_) {
            has_bought_ = true;
            return Signal::Buy;
        }

        return Signal::Hold;
    }

private:
    // Tracks whether the initial Buy signal was issued.
    bool has_bought_ = false;
};

} // namespace atlas
