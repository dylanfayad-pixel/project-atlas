#include "atlas/csv_reader.hpp"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <stdexcept>
#include <vector>

namespace {

constexpr std::size_t expected_records = 100000;
constexpr std::size_t trials = 15;
constexpr const char* filepath = "data/benchmark_100k.csv";

double measure(std::size_t capacity_hint) {
    const auto start = std::chrono::steady_clock::now();

    const auto bars =
        atlas::CsvReader::read(filepath, capacity_hint);

    const auto end = std::chrono::steady_clock::now();

    if (bars.size() != expected_records) {
        throw std::runtime_error("Incorrect record count");
    }

    return std::chrono::duration<double>(end - start).count();
}

double median(std::vector<double> values) {
    std::sort(values.begin(), values.end());
    return values[values.size() / 2];
}

} // namespace

int main() {
    try {
        for (int i = 0; i < 3; ++i) {
            (void)measure(0);
            (void)measure(expected_records);
        }

        std::vector<double> unreserved;
        std::vector<double> reserved;

        for (std::size_t i = 0; i < trials; ++i) {
            double a;
            double b;

            if (i % 2 == 0) {
                a = measure(0);
                b = measure(expected_records);
            } else {
                b = measure(expected_records);
                a = measure(0);
            }

            unreserved.push_back(a);
            reserved.push_back(b);

            std::cout << "Trial " << i + 1
                      << ": unreserved="
                      << std::fixed << std::setprecision(3)
                      << a * 1000.0
                      << " ms, reserved="
                      << b * 1000.0 << " ms\n";
        }

        const double baseline = median(unreserved);
        const double optimized = median(reserved);

        const double improvement =
            (baseline - optimized) / baseline * 100.0;

        std::cout << "\nSummary\n";
        std::cout << "Unreserved median: "
                  << baseline * 1000.0 << " ms\n";
        std::cout << "Reserved median: "
                  << optimized * 1000.0 << " ms\n";
        std::cout << "Time reduction: "
                  << improvement << "%\n";

        std::cout << "Unreserved throughput: "
                  << std::setprecision(0)
                  << expected_records / baseline
                  << " records/s\n";

        std::cout << "Reserved throughput: "
                  << expected_records / optimized
                  << " records/s\n";

        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Benchmark failed: "
                  << error.what() << '\n';
        return 1;
    }
}
