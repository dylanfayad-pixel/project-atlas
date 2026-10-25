#include "atlas/market_bar_validator.hpp"

#include <cassert>
#include <limits>

int main() {
    const atlas::MarketBar valid{
        "2026-10-19", 100.0, 105.0,
        99.0, 103.0, 1250000
    };

    assert(atlas::is_valid_market_bar(valid));

    auto negative = valid;
    negative.open = -100.0;
    assert(!atlas::is_valid_market_bar(negative));

    auto missing_timestamp = valid;
    missing_timestamp.timestamp = "";
    assert(!atlas::is_valid_market_bar(missing_timestamp));

    auto invalid_high = valid;
    invalid_high.high = 98.0;
    assert(!atlas::is_valid_market_bar(invalid_high));

    auto nan_price = valid;
    nan_price.close =
        std::numeric_limits<double>::quiet_NaN();
    assert(!atlas::is_valid_market_bar(nan_price));

    auto zero_volume = valid;
    zero_volume.volume = 0;
    assert(atlas::is_valid_market_bar(zero_volume));

    return 0;
}
