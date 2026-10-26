#pragma once

#include "atlas/market_bar.hpp"

#include <cstddef>
#include <string>
#include <vector>

namespace atlas {

class CsvReader {
public:
    static std::vector<MarketBar> read(
        const std::string& filepath,
        std::size_t capacity_hint = 0
    );
};

} // namespace atlas
