#include "atlas/csv_reader.hpp"
#include <cstdlib>

#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>

namespace {

void require(bool condition, const std::string& message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

void test_invalid_row(
    const std::string& row,
    const std::string& description
) {
    namespace fs = std::filesystem;

    std::string pattern =
        (fs::temp_directory_path() /
         "atlas_csv_columns_XXXXXX").string();

    const char* created = ::mkdtemp(pattern.data());

    if (created == nullptr) {
        throw std::runtime_error(
            "Cannot create temporary test directory"
        );
    }

    const fs::path directory(created);

    struct Cleanup {
        fs::path path;

        ~Cleanup() {
            std::error_code ec;
            fs::remove_all(path, ec);
        }
    } cleanup{directory};

    const auto path = directory / "test.csv";

    {
        std::ofstream file(path);

        require(file.is_open(), "Cannot create test file");

        file << "timestamp,open,high,low,close,volume\n";
        file << row << '\n';
    }

    bool rejected = false;

    try {
        (void)atlas::CsvReader::read(path.string());
    } catch (const std::runtime_error& error) {
        const std::string message = error.what();

        rejected =
            message.find("Expected 6 fields") !=
                std::string::npos &&
            message.find("line 2") != std::string::npos;
    }



    require(rejected, description);
}


void test_invalid_number(
    const std::string& row,
    const std::string& description
) {
    namespace fs = std::filesystem;

    std::string pattern =
        (fs::temp_directory_path() /
         "atlas_csv_numbers_XXXXXX").string();

    const char* created = ::mkdtemp(pattern.data());

    if (created == nullptr) {
        throw std::runtime_error("Cannot create temp directory");
    }

    const fs::path directory(created);

    struct Cleanup {
        fs::path path;
        ~Cleanup() {
            std::error_code ec;
            fs::remove_all(path, ec);
        }
    } cleanup{directory};

    const auto path = directory / "test.csv";

    {
        std::ofstream file(path);
        require(file.is_open(), "Cannot create CSV fixture");
        file << "timestamp,open,high,low,close,volume\n";
        file << row << '\n';
    }

    bool rejected = false;

    try {
        (void)atlas::CsvReader::read(path.string());
    } catch (const std::runtime_error& error) {
        const std::string message = error.what();
        rejected =
            (message.find("Invalid number") != std::string::npos ||
             message.find("Invalid OHLCV data") != std::string::npos) &&
            message.find("line 2") != std::string::npos;
    }

    require(rejected, description);
}

} // namespace

int main() {
    try {
        test_invalid_row(
            "2026-10-19,100,105,99,103",
            "Missing column was not rejected"
        );

        test_invalid_row(
            "2026-10-19,100,105,99,103,1250000,extra",
            "Extra column was not rejected"
        );

        test_invalid_row(
            "2026-10-19,100,105",
            "Multiple missing columns were not rejected"
        );


        test_invalid_number(
            "2026-10-19,abc,105,99,103,1000",
            "Malformed price accepted"
        );

        test_invalid_number(
            "2026-10-19,1e9999,105,99,103,1000",
            "Overflowing price accepted"
        );

        test_invalid_number(
            "2026-10-19,nan,105,99,103,1000",
            "NaN price accepted"
        );

        test_invalid_number(
            "2026-10-19,100,105,99,103,-1",
            "Negative volume accepted"
        );

        test_invalid_number(
            "2026-10-19,100,105,99,103,18446744073709551616",
            "Overflowing volume accepted"
        );

        std::cout << "CSV column regression tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "CSV column test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
