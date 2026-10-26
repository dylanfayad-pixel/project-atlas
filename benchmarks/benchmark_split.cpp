#include <array>
#include <chrono>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

namespace {

constexpr std::size_t iterations = 5000000;

std::vector<std::string_view> split_vector(
    const std::string& line
) {
    std::vector<std::string_view> fields;
    std::string_view remaining(line);

    while (true) {
        const auto pos = remaining.find(',');

        if (pos == std::string_view::npos) {
            fields.push_back(remaining);
            break;
        }

        fields.push_back(remaining.substr(0, pos));
        remaining.remove_prefix(pos + 1);
    }

    return fields;
}

std::array<std::string_view, 6> split_array(
    const std::string& line
) {
    std::array<std::string_view, 6> fields{};
    std::string_view remaining(line);

    for (std::size_t i = 0; i < 5; ++i) {
        const auto pos = remaining.find(',');

        if (pos == std::string_view::npos) {
            throw std::runtime_error("Missing CSV field");
        }

        fields[i] = remaining.substr(0, pos);
        remaining.remove_prefix(pos + 1);
    }

    if (remaining.find(',') != std::string_view::npos) {
        throw std::runtime_error("Extra CSV field");
    }

    fields[5] = remaining;
    return fields;
}

template <typename Function>
double measure(Function function, const std::string& line) {
    std::size_t checksum = 0;

    const auto start = std::chrono::steady_clock::now();

    for (std::size_t i = 0; i < iterations; ++i) {
        const auto fields = function(line);

        if (fields.size() != 6) {
            throw std::runtime_error("Incorrect field count");
        }

        checksum += fields[i % 6].size();
    }

    const auto end = std::chrono::steady_clock::now();

    if (checksum == 0) {
        throw std::runtime_error("Invalid checksum");
    }

    return std::chrono::duration<double>(end - start).count();
}

} // namespace

int main() {
    const std::string line =
        "2026-10-19,100.00,105.00,99.00,103.00,1250000";

    // Warm up both implementations.
    (void)measure(split_vector, line);
    (void)measure(split_array, line);

    for (int trial = 1; trial <= 5; ++trial) {
        const double vector_time = measure(split_vector, line);
        const double array_time = measure(split_array, line);

        std::cout << "Trial " << trial
                  << ": vector=" << std::fixed
                  << std::setprecision(3)
                  << vector_time * 1000.0 << " ms"
                  << ", array="
                  << array_time * 1000.0 << " ms\n";
    }

    return 0;
}
