// Verifies that strategy signals are exported correctly.
// Uses a temporary directory to avoid modifying repository files.

#include "atlas/signal_exporter.hpp"

#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

void require(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

} // namespace

int main() {
    namespace fs = std::filesystem;

    try {
        // Use a dedicated temporary directory for this test.
        // Create a unique directory for this test process.
        std::string pattern =
            (fs::temp_directory_path() /
             "atlas_signal_export_XXXXXX").string();

        const char* created = ::mkdtemp(pattern.data());

        if (created == nullptr) {
            throw std::runtime_error(
                "Cannot create temporary test directory"
            );
        }

        const fs::path directory(created);

        // Automatically clean up, even if an assertion throws.
        struct Cleanup {
            fs::path path;

            ~Cleanup() {
                std::error_code ec;
                fs::remove_all(path, ec);
            }
        } cleanup{directory};

        const auto output = directory / "signals.csv";

        const std::vector<atlas::SignalEvent> events{
            {0, "2026-10-19", atlas::Signal::Buy},
            {1, "2026-10-20", atlas::Signal::Hold},
            {2, "2026-10-21", atlas::Signal::Sell}
        };

        // Export three known signals.
        atlas::SignalExporter::write_csv(
            output.string(),
            events
        );

        std::ifstream file(output);
        require(file.is_open(), "Cannot read exported CSV");

        const std::vector<std::string> expected{
            "index,timestamp,signal",
            "0,2026-10-19,BUY",
            "1,2026-10-20,HOLD",
            "2,2026-10-21,SELL"
        };

        std::string line;

        for (const auto& expected_line : expected) {
            require(
                static_cast<bool>(std::getline(file, line)),
                "Missing CSV output line"
            );

            require(
                line == expected_line,
                "Incorrect CSV output"
            );
        }

        require(
            !static_cast<bool>(std::getline(file, line)),
            "Unexpected extra CSV rows"
        );

        file.close();

        // Empty input should still produce the CSV header.
        atlas::SignalExporter::write_csv(
            output.string(),
            {}
        );

        std::ifstream empty_file(output);
        require(
            static_cast<bool>(std::getline(empty_file, line)),
            "Empty export missing header"
        );

        require(
            line == "index,timestamp,signal",
            "Incorrect empty export header"
        );

        empty_file.close();

        // An invalid output directory should be rejected.
        bool rejected = false;

        try {
            atlas::SignalExporter::write_csv(
                (directory / "missing" / "signals.csv").string(),
                events
            );
        } catch (const std::runtime_error&) {
            rejected = true;
        }

        require(rejected, "Invalid output path accepted");



        std::cout << "Signal exporter tests passed!\n";
        return 0;

    } catch (const std::exception& error) {
        std::cerr << "Signal exporter test failed: "
                  << error.what() << '\n';
        return 1;
    }
}
