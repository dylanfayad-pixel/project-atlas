#include "atlas/csv_reader.hpp"

#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: benchmark_capacity_memory "
                  << "[reserved|unreserved]\n";
        return 1;
    }

    const std::string mode = argv[1];

    if (mode != "reserved" && mode != "unreserved") {
        std::cerr << "Invalid mode\n";
        return 1;
    }

    constexpr std::size_t expected_records = 100000;

    const std::size_t hint =
        mode == "reserved" ? expected_records : 0;

    const auto bars = atlas::CsvReader::read(
        "data/benchmark_100k.csv",
        hint
    );

    if (bars.size() != expected_records) {
        throw std::runtime_error("Incorrect record count");
    }

    std::cout << "Mode: " << mode << '\n';
    std::cout << "Records: " << bars.size() << '\n';

    return 0;
}
