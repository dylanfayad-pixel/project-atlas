#pragma once

#include <cstdint>
#include <string>

namespace atlas {

struct MarketBar {
    std::string timestamp;
    double open;
    double high;
    double low;
    double close;
    std::uint64_t volume;
};

} // namespace atlas
