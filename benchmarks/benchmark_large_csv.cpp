#include "atlas/csv_reader.hpp"

#include <algorithm>
#include <chrono>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <stdexcept>
#include <vector>

int main() {
    constexpr std::size_t expected_records = 100000;
    constexpr std::size_t warmup_runs = 2;
    constexpr std::size_t measured_runs = 7;

    const char* filepath = "data/benchmark_100k.csv";

    for (std::size_t i = 0; i < warmup_runs; ++i) {
        const auto bars = atlas::CsvReader::read(filepath);

        if (bars.size() != expected_records) {
            throw std::runtime_error("Warmup record count mismatch");
        }
    }

    std::vector<double> durations;
    durations.reserve(measured_runs);

    std::cout << "Project Atlas Large CSV Benchmark\n";
    std::cout << "Records per file: " << expected_records << '\n';

    for (std::size_t trial = 0; trial < measured_runs; ++trial) {
        const auto start = std::chrono::steady_clock::now();

        const auto bars = atlas::CsvReader::read(filepath);

        const auto end = std::chrono::steady_clock::now();

        if (bars.size() != expected_records) {
            throw std::runtime_error("Record count mismatch");
        }

        const double seconds =
            std::chrono::duration<double>(end - start).count();

        durations.push_back(seconds);

        const double throughput =
            static_cast<double>(bars.size()) / seconds;

        std::cout << "Trial " << (trial + 1)
                  << ": " << std::fixed
                  << std::setprecision(3)
                  << seconds * 1000.0 << " ms, "
                  << std::setprecision(0)
                  << throughput << " records/s\n";
    }

    std::sort(durations.begin(), durations.end());

    const double median = durations[measured_runs / 2];

    const double mean =
        std::accumulate(durations.begin(), durations.end(), 0.0)
        / static_cast<double>(measured_runs);

    std::cout << "\nSummary\n";
    std::cout << std::setprecision(3);
    std::cout << "Minimum: "
              << durations.front() * 1000.0 << " ms\n";
    std::cout << "Median: "
              << median * 1000.0 << " ms\n";
    std::cout << "Mean: "
              << mean * 1000.0 << " ms\n";
    std::cout << "Maximum: "
              << durations.back() * 1000.0 << " ms\n";

    std::cout << std::setprecision(0);
    std::cout << "Median-based throughput: "
              << static_cast<double>(expected_records) / median
              << " records/s\n";

    return 0;
}
