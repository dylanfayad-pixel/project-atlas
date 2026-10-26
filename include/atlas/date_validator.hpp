#pragma once

#include <chrono>
#include <string_view>

namespace atlas {

inline bool is_valid_date(std::string_view date) {
    if (date.size() != 10 ||
        date[4] != '-' ||
        date[7] != '-') {
        return false;
    }

    for (std::size_t i = 0; i < date.size(); ++i) {
        if (i == 4 || i == 7) {
            continue;
        }

        if (date[i] < '0' || date[i] > '9') {
            return false;
        }
    }

    const auto digit = [&](std::size_t i) {
        return static_cast<unsigned>(date[i] - '0');
    };

    const int year =
        static_cast<int>(digit(0) * 1000 +
                         digit(1) * 100 +
                         digit(2) * 10 +
                         digit(3));

    const unsigned month =
        digit(5) * 10 + digit(6);

    const unsigned day =
        digit(8) * 10 + digit(9);

    if (year < 1) {
        return false;
    }

    const std::chrono::year_month_day ymd{
        std::chrono::year{year},
        std::chrono::month{month},
        std::chrono::day{day}
    };

    return ymd.ok();
}

} // namespace atlas
