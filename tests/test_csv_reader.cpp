#include "atlas/csv_reader.hpp"

#include <cmath>
#include <iostream>
#include <stdexcept>
#include <string>

void require(bool condition, const std::string& message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

int main() {
    try {
        const auto bars =
            atlas::CsvReader::read("data/sample_ohlcv.csv");

        require(bars.size() == 5, "Expected exactly 5 bars");

        const auto reserved_bars = atlas::CsvReader::read(
            "data/sample_ohlcv.csv",
            5
        );

        require(
            reserved_bars.size() == bars.size(),
            "Reserved reader returned incorrect record count"
        );

        for (std::size_t i = 0; i < bars.size(); ++i) {
            require(
                reserved_bars[i].timestamp == bars[i].timestamp &&
                reserved_bars[i].open == bars[i].open &&
                reserved_bars[i].high == bars[i].high &&
                reserved_bars[i].low == bars[i].low &&
                reserved_bars[i].close == bars[i].close &&
                reserved_bars[i].volume == bars[i].volume,
                "Reserved reader produced different market data"
            );
        }


        require(
            bars[0].timestamp == "2026-10-19",
            "Incorrect first timestamp"
        );

        require(
            std::abs(bars[0].open - 100.0) < 1e-9,
            "Incorrect first opening price"
        );

        require(
            bars[0].volume == 1250000,
            "Incorrect first volume"
        );

        require(
            std::abs(bars[4].close - 113.0) < 1e-9,
            "Incorrect final closing price"
        );

        std::cout << "CSV reader tests passed!\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "CSV reader test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
