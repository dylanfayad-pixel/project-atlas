#pragma once

#include "atlas/market_bar.hpp"

#include <string>
#include <vector>

namespace atlas {

class CsvReader {
public:
    static std::vector<MarketBar> read(const std::string& filepath);
};

} // namespace atlas
