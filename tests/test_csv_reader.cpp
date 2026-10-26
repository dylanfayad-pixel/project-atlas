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
