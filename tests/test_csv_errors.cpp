#include "atlas/csv_reader.hpp"

#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>

namespace {

void require(bool condition, const std::string& message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

void expect_failure(
    const std::filesystem::path& path,
    std::string_view expected_error
) {
    try {
        (void)atlas::CsvReader::read(path.string());
    } catch (const std::runtime_error& error) {
        require(
            std::string_view(error.what()).find(expected_error)
                != std::string_view::npos,
            "Unexpected error message: " +
                std::string(error.what())
        );
        return;
    }

    throw std::runtime_error(
        "Expected CSV reader to reject: " + path.string()
    );
}

void write_file(
    const std::filesystem::path& path,
    const std::string& content
) {
    std::ofstream file(path);

    if (!file) {
        throw std::runtime_error("Cannot create test file");
    }

    file << content;

    if (!file) {
        throw std::runtime_error("Cannot write test file");
    }
}

} // namespace

int main() {
    try {
        const auto directory =
            std::filesystem::temp_directory_path() /
            "atlas_csv_error_tests";

        std::filesystem::create_directories(directory);

        const auto path = directory / "invalid.csv";

        const std::string header =
            "timestamp,open,high,low,close,volume\n";

        expect_failure(
            directory / "missing_file.csv",
            "Cannot open CSV file"
        );

        write_file(path, "wrong,header\n");
        expect_failure(path, "Invalid CSV header");

        write_file(
            path,
            header + "2026-10-19,100,105\n"
        );
        expect_failure(path, "Expected 6 fields");

        write_file(
            path,
            header + "2026-10-19,abc,105,99,103,1000\n"
        );
        expect_failure(path, "Invalid number");

        write_file(
            path,
            header + "2026-10-19,100,95,99,103,1000\n"
        );
        expect_failure(path, "Invalid OHLCV data");

        // Regression test: Windows-style CRLF line endings.
        write_file(
            path,
            "timestamp,open,high,low,close,volume\r\n"
            "2026-10-19,100,105,99,103,1000\r\n"
            "2026-10-20,103,108,102,107,1200\r\n"
        );

        const auto crlf_bars = atlas::CsvReader::read(path.string());

        require(
            crlf_bars.size() == 2,
            "CRLF CSV should contain exactly two records"
        );

        require(
            crlf_bars[1].timestamp == "2026-10-20",
            "CRLF timestamp parsed incorrectly"
        );

        std::filesystem::remove(path);
        std::filesystem::remove(directory);

        std::cout << "All CSV error tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "CSV error test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
