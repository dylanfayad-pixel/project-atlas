#include "atlas/portfolio_json_exporter.hpp"

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <optional>
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

// Undefined financial statistics become JSON null.
// Present values must be finite.
void write_optional_number(
    std::ostream& out,
    const std::optional<double>& value
) {
    if (!value.has_value()) {
        out << "null";
        return;
    }

    require_finite(*value);
    out << *value;
}

// Stable event names form part of the JSON v3 contract.
const char* risk_event_name(RiskEventType type) {
    switch (type) {
        case RiskEventType::DrawdownBreach:
            return "DRAWDOWN_BREACH";
        case RiskEventType::LiquidationExecuted:
            return "LIQUIDATION_EXECUTED";
        case RiskEventType::LiquidationRejected:
            return "LIQUIDATION_REJECTED";
    }

    throw std::invalid_argument("Invalid risk event type");
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


std::string PortfolioJsonExporter::serialize_v3(
    const PortfolioResult& portfolio,
    const PerformanceMetrics& metrics,
    const RiskMetrics& risk_metrics,
    const RiskConfig& risk_config,
    const ExecutionConfig& execution_config,
    const std::string& strategy_name
) {
    // Reuse v2 financial validation and serialization.
    // Only the additional v3 reporting fields are built here.
    std::string json = serialize(
        portfolio, metrics, strategy_name, 2
    );

    if (!std::isfinite(risk_config.periods_per_year) ||
        risk_config.periods_per_year <= 0.0 ||
        !std::isfinite(risk_config.risk_free_rate_per_period) ||
        !std::isfinite(risk_config.target_return_per_period)) {
        throw std::invalid_argument(
            "Invalid risk reporting configuration"
        );
    }

    if (!std::isfinite(execution_config.commission_per_trade) ||
        execution_config.commission_per_trade < 0.0 ||
        !std::isfinite(execution_config.slippage_bps) ||
        execution_config.slippage_bps < 0.0 ||
        execution_config.slippage_bps >= 10000.0 ||
        !std::isfinite(execution_config.max_entry_allocation) ||
        execution_config.max_entry_allocation < 0.0 ||
        execution_config.max_entry_allocation > 1.0 ||
        !std::isfinite(execution_config.max_entry_exposure) ||
        execution_config.max_entry_exposure < 0.0 ||
        execution_config.max_entry_exposure > 1.0 ||
        !std::isfinite(execution_config.max_drawdown_fraction) ||
        execution_config.max_drawdown_fraction <= 0.0 ||
        execution_config.max_drawdown_fraction > 1.0) {
        throw std::invalid_argument(
            "Invalid execution reporting configuration"
        );
    }

    // Verify risk statistics against the supplied portfolio.
    const auto expected = RiskAnalyzer::analyze(
        portfolio, risk_config
    );

    const auto matches = [](const std::optional<double>& a,
                            const std::optional<double>& b) {
        if (a.has_value() != b.has_value()) {
            return false;
        }
        if (!a.has_value()) {
            return true;
        }
        return std::isfinite(*a) && std::isfinite(*b) &&
            std::abs(*a - *b) <=
            1e-9 * std::max({1.0, std::abs(*a), std::abs(*b)});
    };

    if (risk_metrics.return_observations !=
            expected.return_observations ||
        !matches(risk_metrics.annualized_volatility_pct,
                 expected.annualized_volatility_pct) ||
        !matches(risk_metrics.sharpe_ratio,
                 expected.sharpe_ratio) ||
        !matches(risk_metrics.downside_deviation_pct,
                 expected.downside_deviation_pct) ||
        !matches(risk_metrics.sortino_ratio,
                 expected.sortino_ratio)) {
        throw std::invalid_argument(
            "Risk metrics disagree with portfolio observations"
        );
    }

    // Derive exposure from recorded closing-equity accounting.
    std::ostringstream extra;
    extra << std::setprecision(17);

    extra << "  \"risk_metrics\": {\n";
    extra << "    \"return_observations\": "
          << risk_metrics.return_observations << ",\n";
    extra << "    \"periods_per_year\": "
          << risk_config.periods_per_year << ",\n";
    extra << "    \"risk_free_rate_per_period\": "
          << risk_config.risk_free_rate_per_period << ",\n";
    extra << "    \"target_return_per_period\": "
          << risk_config.target_return_per_period << ",\n";

    extra << "    \"annualized_volatility_pct\": ";
    write_optional_number(extra, risk_metrics.annualized_volatility_pct);
    extra << ",\n";

    extra << "    \"sharpe_ratio\": ";
    write_optional_number(extra, risk_metrics.sharpe_ratio);
    extra << ",\n";

    extra << "    \"downside_deviation_pct\": ";
    write_optional_number(extra, risk_metrics.downside_deviation_pct);
    extra << ",\n";

    extra << "    \"sortino_ratio\": ";
    write_optional_number(extra, risk_metrics.sortino_ratio);
    extra << "\n  },\n";

    extra << "  \"exposure\": {\n";
    extra << "    \"observations\": [\n";

    double maximum_exposure = 0.0;

    for (std::size_t i = 0;
         i < portfolio.equity_curve.size(); ++i) {
        const auto& point = portfolio.equity_curve[i];

        if (point.equity <= 0.0 ||
            point.cash < 0.0 ||
            point.shares < 0.0) {
            throw std::invalid_argument(
                "Invalid equity observation for exposure"
            );
        }

        const double position_value =
            point.equity - point.cash;

        const double fraction =
            position_value / point.equity;

        require_finite(position_value);
        require_finite(fraction);

        const double tolerance = 1e-9;

        if (position_value < -tolerance ||
            fraction < -tolerance ||
            fraction > 1.0 + tolerance) {
            throw std::invalid_argument(
                "Invalid long-only exposure"
            );
        }

        const double normalized =
            std::clamp(fraction, 0.0, 1.0);

        maximum_exposure =
            std::max(maximum_exposure, normalized);

        extra << "      {\"index\": " << point.index
              << ", \"timestamp\": \""
              << escape_json(point.timestamp)
              << "\", \"fraction\": " << normalized
              << "}";

        if (i + 1 < portfolio.equity_curve.size()) {
            extra << ",";
        }
        extra << "\n";
    }

    extra << "    ],\n";
    extra << "    \"maximum_observed_fraction\": "
          << maximum_exposure << "\n";
    extra << "  },\n";

    extra << "  \"risk_controls\": {\n";
    extra << "    \"max_entry_allocation\": "
          << execution_config.max_entry_allocation << ",\n";
    extra << "    \"max_entry_exposure\": "
          << execution_config.max_entry_exposure << ",\n";
    extra << "    \"max_drawdown_fraction\": "
          << execution_config.max_drawdown_fraction << ",\n";
    extra << "    \"liquidate_on_drawdown\": "
          << (execution_config.liquidate_on_drawdown
              ? "true" : "false") << ",\n";
    extra << "    \"events\": [\n";

    std::size_t previous_index = 0;
    bool observed_breach = false;

    // Reported risk events must agree with the
    // circuit-breaker configuration supplied for v3.
    if (execution_config.max_drawdown_fraction == 1.0 &&
        !portfolio.risk_events.empty()) {
        throw std::invalid_argument(
            "Disabled drawdown control has risk events"
        );
    }

    for (std::size_t i = 0;
         i < portfolio.risk_events.size(); ++i) {
        const auto& event = portfolio.risk_events[i];

        if (event.index < previous_index ||
            event.index >= portfolio.equity_curve.size() ||
            event.timestamp !=
                portfolio.equity_curve[event.index].timestamp) {
            throw std::invalid_argument(
                "Invalid risk event chronology"
            );
        }

        require_finite(event.drawdown_fraction);

        if (event.drawdown_fraction < 0.0 ||
            event.drawdown_fraction > 1.0) {
            throw std::invalid_argument(
                "Invalid risk event drawdown"
            );
        }

        if (event.type == RiskEventType::DrawdownBreach) {
            if (event.drawdown_fraction + 1e-12 <
                execution_config.max_drawdown_fraction) {
                throw std::invalid_argument(
                    "Drawdown breach below configured threshold"
                );
            }

            if (observed_breach) {
                throw std::invalid_argument(
                    "Duplicate drawdown breach"
                );
            }
            observed_breach = true;
        } else {
            if (!observed_breach) {
                throw std::invalid_argument(
                    "Liquidation event without breach"
                );
            }

            if (!execution_config.liquidate_on_drawdown) {
                throw std::invalid_argument(
                    "Liquidation event with liquidation disabled"
                );
            }

            if (event.index <=
                portfolio.risk_events.front().index) {
                throw std::invalid_argument(
                    "Liquidation event cannot precede next bar"
                );
            }
        }

        // Reconcile liquidation outcomes against recorded fills.
        // A rejected attempt must not be represented as a SELL.
        if (event.type == RiskEventType::LiquidationExecuted ||
            event.type == RiskEventType::LiquidationRejected) {

            std::size_t sell_count = 0;

            for (const auto& trade : portfolio.trades) {
                if (trade.index == event.index &&
                    trade.side == Signal::Sell &&
                    trade.timestamp == event.timestamp) {
                    ++sell_count;
                }
            }

            if (event.type == RiskEventType::LiquidationExecuted &&
                sell_count != 1) {
                throw std::invalid_argument(
                    "Executed liquidation has no unique SELL fill"
                );
            }

            if (event.type == RiskEventType::LiquidationRejected &&
                sell_count != 0) {
                throw std::invalid_argument(
                    "Rejected liquidation conflicts with SELL fill"
                );
            }
        }

        extra << "      {\"index\": " << event.index
              << ", \"timestamp\": \""
              << escape_json(event.timestamp)
              << "\", \"type\": \""
              << risk_event_name(event.type)
              << "\", \"drawdown_fraction\": "
              << event.drawdown_fraction << "}";

        if (i + 1 < portfolio.risk_events.size()) {
            extra << ",";
        }
        extra << "\n";

        previous_index = event.index;
    }

    extra << "    ]\n";
    extra << "  }\n";

    // Replace v2's closing object delimiter with v3 sections.
    const std::string ending = "}\n";
    if (json.size() < ending.size() ||
        json.compare(json.size() - ending.size(),
                     ending.size(), ending) != 0) {
        throw std::logic_error(
            "Unexpected legacy JSON serialization ending"
        );
    }

    json.erase(json.size() - ending.size());
    json.insert(json.find("\"schema_version\": 2"),
                "");
    const auto version_position =
        json.find("\"schema_version\": 2");

    if (version_position == std::string::npos) {
        throw std::logic_error(
            "Legacy schema version missing"
        );
    }

    json.replace(version_position,
                 std::string("\"schema_version\": 2").size(),
                 "\"schema_version\": 3");

    // The legacy JSON ends with the trades array.
    // Append the v3 fields as additional top-level members.
    if (json.empty() || json.back() != '\n') {
        throw std::logic_error("Invalid legacy JSON boundary");
    }

    json.pop_back();
    json += ",\n";
    json += extra.str();
    json += "}\n";

    return json;
}


} // namespace atlas
