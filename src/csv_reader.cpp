#include "atlas/csv_reader.hpp"
#include "atlas/market_bar_validator.hpp"

#include <charconv>
#include <fstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <system_error>
#include <vector>
#include <utility>

namespace atlas {
namespace {

constexpr std::string_view expected_header =
    "timestamp,open,high,low,close,volume";

std::vector<std::string_view> split_csv(
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

template <typename T>
T parse_number(
    std::string_view text,
    std::size_t line_number
) {
    T value{};

    const auto result = std::from_chars(
        text.data(),
        text.data() + text.size(),
        value
    );

    if (result.ec != std::errc{} ||
        result.ptr != text.data() + text.size()) {
        throw std::runtime_error(
            "Invalid number at CSV line " +
            std::to_string(line_number)
        );
    }

    return value;
}

} // namespace

std::vector<MarketBar> CsvReader::read(
    const std::string& filepath
) {
    std::ifstream file(filepath);

    if (!file.is_open()) {
        throw std::runtime_error(
            "Cannot open CSV file: " + filepath
        );
    }

    std::string line;
    std::size_t line_number = 1;

    if (!std::getline(file, line) ||
        line != expected_header) {
        throw std::runtime_error(
            "Invalid CSV header"
        );
    }

    std::vector<MarketBar> bars;

    while (std::getline(file, line)) {
        ++line_number;

        if (line.empty()) {
            throw std::runtime_error(
                "Empty CSV row at line " +
                std::to_string(line_number)
            );
        }

        const auto fields = split_csv(line);

        if (fields.size() != 6) {
            throw std::runtime_error(
                "Expected 6 fields at CSV line " +
                std::to_string(line_number)
            );
        }

        MarketBar bar{
            std::string(fields[0]),
            parse_number<double>(fields[1], line_number),
            parse_number<double>(fields[2], line_number),
            parse_number<double>(fields[3], line_number),
            parse_number<double>(fields[4], line_number),
            parse_number<std::uint64_t>(
                fields[5], line_number
            )
        };

        if (!is_valid_market_bar(bar)) {
            throw std::runtime_error(
                "Invalid OHLCV data at CSV line " +
                std::to_string(line_number)
            );
        }

        bars.push_back(std::move(bar));
    }

    if (file.bad()) {
        throw std::runtime_error(
            "Error reading CSV file: " + filepath
        );
    }

    return bars;
}

} // namespace atlas
