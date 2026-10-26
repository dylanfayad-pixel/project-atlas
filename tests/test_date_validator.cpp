#include "atlas/date_validator.hpp"

#include <iostream>
#include <stdexcept>
#include <string>

void require(bool condition, const std::string& message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

int main() {
    try {
        require(
            atlas::is_valid_date("2026-10-19"),
            "Valid date rejected"
        );

        require(
            atlas::is_valid_date("2024-02-29"),
            "Valid leap day rejected"
        );

        require(
            !atlas::is_valid_date("2025-02-29"),
            "Invalid leap day accepted"
        );

        require(
            !atlas::is_valid_date("2026-02-30"),
            "Invalid February date accepted"
        );

        require(
            !atlas::is_valid_date("2026-13-01"),
            "Invalid month accepted"
        );

        require(
            !atlas::is_valid_date("2026/10/19"),
            "Invalid date format accepted"
        );

        require(
            !atlas::is_valid_date("hello"),
            "Non-date text accepted"
        );

        std::cout << "All date validation tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Date validation test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
