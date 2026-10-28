#include "atlas/portfolio_json_exporter.hpp"

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <string_view>

namespace atlas {
namespace {

// Escape characters that have special meaning inside JSON strings.
std::string escape_json(std::string_view input) {
    std::ostringstream escaped;

    for (const unsigned char ch : input) {
        switch (ch) {
            case '"': escaped << "\\\""; break;
            case '\\': escaped << "\\\\"; break;
            case '\n': escaped << "\\n"; break;
            case '\r': escaped << "\\r"; break;
            case '\t': escaped << "\\t"; break;
            default:
                if (ch < 0x20) {
                    escaped << "\\u"
                            << std::hex << std::setw(4)
                            << std::setfill('0')
                            << static_cast<unsigned>(ch)
                            << std::dec << std::setfill(' ');
                } else {
                    escaped << static_cast<char>(ch);
                }
        }
    }

    return escaped.str();
}

// JSON has no representation for NaN or infinity.
void require_finite(double value) {
    if (!std::isfinite(value)) {
        throw std::invalid_argument(
            "Cannot export non-finite portfolio value"
        );
    }
}

const char* signal_name(Signal signal) {
    switch (signal) {
        case Signal::Buy: return "BUY";
        case Signal::Sell: return "SELL";
        case Signal::Hold: return "HOLD";
    }

    throw std::invalid_argument("Invalid signal value");
}

} // namespace

std::string PortfolioJsonExporter::serialize(
    const PortfolioResult& portfolio,
    const PerformanceMetrics& metrics,
    const std::string& strategy_name,
    int schema_version
) {
    // Preserve v1 for existing consumers; v2 adds cost reporting.
    if (schema_version != 1 && schema_version != 2) {
        throw std::invalid_argument(
            "Unsupported portfolio JSON schema version"
        );
    }

    // Validate all numeric fields before producing JSON.
    require_finite(portfolio.initial_capital);
    require_finite(portfolio.final_equity);
    require_finite(metrics.net_profit);
    require_finite(metrics.total_return_pct);
    require_finite(metrics.maximum_drawdown_pct);

    if (schema_version == 2) {
        require_finite(portfolio.total_commission);
        require_finite(portfolio.total_slippage_cost);

        if (portfolio.total_commission < 0.0 ||
            portfolio.total_slippage_cost < 0.0) {
            throw std::invalid_argument(
                "Negative portfolio execution costs"
            );
        }
    }

    for (const auto& point : portfolio.equity_curve) {
        require_finite(point.cash);
        require_finite(point.shares);
        require_finite(point.equity);
    }

    for (const auto& trade : portfolio.trades) {
        require_finite(trade.price);
        require_finite(trade.quantity);

        if (schema_version == 2) {
            require_finite(trade.commission_paid);
            require_finite(trade.slippage_cost);

            if (trade.commission_paid < 0.0 ||
                trade.slippage_cost < 0.0) {
                throw std::invalid_argument(
                    "Negative trade execution costs"
                );
            }
        }
    }

    if (schema_version == 2) {
        // Reconcile portfolio totals against recorded fills.
        double commissions = 0.0;
        double slippage = 0.0;

        for (const auto& trade : portfolio.trades) {
            commissions += trade.commission_paid;
            slippage += trade.slippage_cost;
        }

        const auto matches = [](double a, double b) {
            return std::isfinite(a) && std::isfinite(b) &&
                std::abs(a - b) <=
                1e-9 * std::max({1.0, std::abs(a), std::abs(b)});
        };

        if (!matches(commissions, portfolio.total_commission) ||
            !matches(slippage, portfolio.total_slippage_cost)) {
            throw std::invalid_argument(
                "Portfolio execution cost totals disagree"
            );
        }
    }

    std::ostringstream out;
    out << std::setprecision(17);

    out << "{\n";
    out << "  \"schema_version\": " << schema_version
        << ",\n";
    out << "  \"strategy\": \"" << escape_json(strategy_name) << "\",\n";
    out << "  \"initial_capital\": " << portfolio.initial_capital << ",\n";
    out << "  \"final_equity\": " << portfolio.final_equity << ",\n";
    out << "  \"net_profit\": " << metrics.net_profit << ",\n";
    out << "  \"total_return_pct\": "
        << metrics.total_return_pct << ",\n";
    out << "  \"maximum_drawdown_pct\": "
        << metrics.maximum_drawdown_pct << ",\n";

    if (schema_version == 2) {
        const double total_cost =
            portfolio.total_commission +
            portfolio.total_slippage_cost;

        require_finite(total_cost);

        out << "  \"total_commission\": "
            << portfolio.total_commission << ",\n";
        out << "  \"total_slippage_cost\": "
            << portfolio.total_slippage_cost << ",\n";
        out << "  \"total_execution_cost\": "
            << total_cost << ",\n";
    }

    out << "  \"equity_curve\": [\n";

    for (std::size_t i = 0; i < portfolio.equity_curve.size(); ++i) {
        const auto& point = portfolio.equity_curve[i];

        out << "    {\"index\": " << point.index
            << ", \"timestamp\": \""
            << escape_json(point.timestamp)
            << "\", \"cash\": " << point.cash
            << ", \"shares\": " << point.shares
            << ", \"equity\": " << point.equity
            << "}";

        if (i + 1 < portfolio.equity_curve.size()) {
            out << ",";
        }
        out << "\n";
    }

    out << "  ],\n";
    out << "  \"trades\": [\n";

    for (std::size_t i = 0; i < portfolio.trades.size(); ++i) {
        const auto& trade = portfolio.trades[i];

        out << "    {\"index\": " << trade.index
            << ", \"timestamp\": \""
            << escape_json(trade.timestamp)
            << "\", \"side\": \""
            << signal_name(trade.side)
            << "\", \"price\": " << trade.price
            << ", \"quantity\": " << trade.quantity;

        if (schema_version == 2) {
            out << ", \"commission_paid\": "
                << trade.commission_paid
                << ", \"slippage_cost\": "
                << trade.slippage_cost;
        }

        out << "}";

        if (i + 1 < portfolio.trades.size()) {
            out << ",";
        }
        out << "\n";
    }

    out << "  ]\n";
    out << "}\n";

    return out.str();
}

} // namespace atlas
