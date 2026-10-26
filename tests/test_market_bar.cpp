#include "atlas/market_bar_validator.hpp"

#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>

namespace {

void require(bool condition, const std::string& message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

} // namespace

int main() {
    try {
        const atlas::MarketBar valid{
            "2026-10-19", 100.0, 105.0,
            99.0, 103.0, 1250000
        };

        require(
            atlas::is_valid_market_bar(valid),
            "Valid market bar rejected"
        );

        auto negative = valid;
        negative.open = -100.0;
        require(
            !atlas::is_valid_market_bar(negative),
            "Negative price accepted"
        );

        auto missing_timestamp = valid;
        missing_timestamp.timestamp = "";
        require(
            !atlas::is_valid_market_bar(missing_timestamp),
            "Empty timestamp accepted"
        );

        auto invalid_high = valid;
        invalid_high.high = 98.0;
        require(
            !atlas::is_valid_market_bar(invalid_high),
            "Invalid high price accepted"
        );

        auto nan_price = valid;
        nan_price.close =
            std::numeric_limits<double>::quiet_NaN();

        require(
            !atlas::is_valid_market_bar(nan_price),
            "NaN price accepted"
        );

        auto zero_volume = valid;
        zero_volume.volume = 0;

        require(
            atlas::is_valid_market_bar(zero_volume),
            "Zero-volume bar rejected"
        );

        std::cout << "Market bar tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Market bar test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
