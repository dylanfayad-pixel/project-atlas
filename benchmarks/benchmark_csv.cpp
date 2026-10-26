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
    constexpr std::size_t warmup_iterations = 2000;
    constexpr std::size_t measured_iterations = 20000;
    constexpr std::size_t trials = 7;
    constexpr std::size_t expected_bars = 5;

    const char* filepath = "data/sample_ohlcv.csv";

    for (std::size_t i = 0; i < warmup_iterations; ++i) {
        const auto bars = atlas::CsvReader::read(filepath);

        if (bars.size() != expected_bars) {
            throw std::runtime_error("Warmup validation failed");
        }
    }

    std::vector<double> durations;
    durations.reserve(trials);

    std::cout << "Project Atlas CSV Benchmark\n";
    std::cout << "Warmup iterations: "
              << warmup_iterations << '\n';
    std::cout << "Measured iterations per trial: "
              << measured_iterations << '\n';

    for (std::size_t trial = 0; trial < trials; ++trial) {
        std::size_t records = 0;

        const auto start = std::chrono::steady_clock::now();

        for (std::size_t i = 0; i < measured_iterations; ++i) {
            const auto bars = atlas::CsvReader::read(filepath);

            if (bars.size() != expected_bars) {
                throw std::runtime_error("Benchmark validation failed");
            }

            records += bars.size();
        }

        const auto end = std::chrono::steady_clock::now();

        const double seconds =
            std::chrono::duration<double>(end - start).count();

        durations.push_back(seconds);

        const double throughput =
            static_cast<double>(records) / seconds;

        std::cout << "Trial " << (trial + 1)
                  << ": " << std::fixed
                  << std::setprecision(3)
                  << seconds * 1000.0 << " ms, "
                  << std::setprecision(0)
                  << throughput << " records/s\n";
    }

    std::sort(durations.begin(), durations.end());

    const double median = durations[trials / 2];

    const double mean =
        std::accumulate(durations.begin(), durations.end(), 0.0)
        / static_cast<double>(trials);

    const double records_per_trial =
        static_cast<double>(measured_iterations * expected_bars);

    std::cout << "\nSummary\n";
    std::cout << std::setprecision(3);
    std::cout << "Minimum time: "
              << durations.front() * 1000.0 << " ms\n";
    std::cout << "Median time: "
              << median * 1000.0 << " ms\n";
    std::cout << "Mean time: "
              << mean * 1000.0 << " ms\n";
    std::cout << "Maximum time: "
              << durations.back() * 1000.0 << " ms\n";

    std::cout << std::setprecision(0);
    std::cout << "Median-based throughput: "
              << records_per_trial / median
              << " records/s\n";

    return 0;
}
