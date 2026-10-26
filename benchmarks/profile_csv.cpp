#include "atlas/csv_reader.hpp"

#include <cstddef>
#include <iostream>
#include <stdexcept>

int main() {
    constexpr std::size_t iterations = 200;
    constexpr std::size_t expected_records = 100000;

    std::size_t total_records = 0;

    for (std::size_t i = 0; i < iterations; ++i) {
        const auto bars = atlas::CsvReader::read(
            "data/benchmark_100k.csv",
            expected_records
        );

        if (bars.size() != expected_records) {
            throw std::runtime_error(
                "Unexpected number of records"
            );
        }

        total_records += bars.size();
    }

    std::cout << "Profiling completed\n";
    std::cout << "Total records: "
              << total_records << '\n';

    return 0;
}
