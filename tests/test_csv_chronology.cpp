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

void write_csv(
    const std::filesystem::path& path,
    const std::string& rows
) {
    std::ofstream file(path);

    if (!file) {
        throw std::runtime_error("Cannot create test CSV");
    }

    file << "timestamp,open,high,low,close,volume\n";
    file << rows;

    if (!file) {
        throw std::runtime_error("Cannot write test CSV");
    }
}

void expect_error(
    const std::filesystem::path& path,
    std::string_view expected
) {
    try {
        (void)atlas::CsvReader::read(path.string());
    } catch (const std::runtime_error& error) {
        require(
            std::string_view(error.what()).find(expected)
                != std::string_view::npos,
            "Unexpected error: " + std::string(error.what())
        );
        return;
    }

    throw std::runtime_error(
        "Expected rejection: " + path.string()
    );
}

} // namespace

int main() {
    try {
        const auto path =
            std::filesystem::temp_directory_path() /
            "atlas_chronology_test.csv";

        write_csv(
            path,
            "2026-02-30,100,105,99,103,1000\n"
        );
        expect_error(path, "Invalid date at CSV line 2");

        write_csv(
            path,
            "2026-10-19,100,105,99,103,1000\n"
            "2026-10-19,103,108,102,107,1200\n"
        );
        expect_error(path, "Duplicate timestamp at CSV line 3");

        write_csv(
            path,
            "2026-10-21,100,105,99,103,1000\n"
            "2026-10-19,103,108,102,107,1200\n"
        );
        expect_error(path, "Out-of-order timestamp at CSV line 3");

        write_csv(
            path,
            "2026-10-19,100,105,99,103,1000\n"
            "2026-10-20,103,108,102,107,1200\n"
        );

        const auto bars = atlas::CsvReader::read(path.string());
        require(bars.size() == 2, "Expected two valid bars");

        std::filesystem::remove(path);

        std::cout << "Chronology tests passed!\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Chronology test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
