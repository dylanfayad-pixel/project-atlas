cmake_minimum_required(VERSION 3.20)

project(
    ProjectAtlas
    VERSION 0.1.0
    DESCRIPTION "C++20 Quantitative Market Data Infrastructure"
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(atlas_core STATIC
    src/csv_reader.cpp
    src/historical_replay.cpp
    src/backtest_runner.cpp
    src/backtest_response.cpp
    src/portfolio_simulator.cpp
    src/performance_metrics.cpp
    src/risk_analytics.cpp
    src/portfolio_json_exporter.cpp
    src/signal_exporter.cpp
)

target_include_directories(atlas_core PUBLIC
    ${PROJECT_SOURCE_DIR}/include
)

target_compile_options(atlas_core PRIVATE
    -Wall -Wextra -Wpedantic
)

add_executable(atlas src/main.cpp)

target_link_libraries(atlas PRIVATE atlas_core)

target_compile_options(atlas PRIVATE
    -Wall -Wextra -Wpedantic
)

# User-data backtesting CLI.
# Reuses the existing Atlas quantitative engine.
add_executable(atlas_backtest_cli
    src/backtest_cli.cpp
)

target_link_libraries(
    atlas_backtest_cli PRIVATE atlas_core
)

target_compile_options(atlas_backtest_cli PRIVATE
    -Wall -Wextra -Wpedantic
)

include(CTest)

# Exercise the compiled CLI with real process boundaries.
find_package(Python3 COMPONENTS Interpreter REQUIRED)

add_test(
    NAME backtest_cli_integration
    COMMAND
        ${Python3_EXECUTABLE}
        ${PROJECT_SOURCE_DIR}/tests/test_backtest_cli.py
        $<TARGET_FILE:atlas_backtest_cli>
)



if(BUILD_TESTING)
    add_test(
        NAME atlas_startup
        COMMAND atlas
    )

    set_tests_properties(atlas_startup PROPERTIES
        PASS_REGULAR_EXPRESSION "System initialized successfully"
    )

    add_executable(test_market_bar
        tests/test_market_bar.cpp
    )

    target_link_libraries(test_market_bar PRIVATE atlas_core)

    target_compile_options(test_market_bar PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME market_bar_validation
        COMMAND test_market_bar
    )
endif()

if(BUILD_TESTING)
    add_executable(test_csv_reader
        tests/test_csv_reader.cpp
    )

    target_link_libraries(test_csv_reader PRIVATE atlas_core)

    target_compile_options(test_csv_reader PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME csv_reader
        COMMAND test_csv_reader
    )

    set_tests_properties(csv_reader PROPERTIES
        WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}"
    )
endif()

if(BUILD_TESTING)
    add_executable(test_csv_errors
        tests/test_csv_errors.cpp
    )

    target_link_libraries(test_csv_errors PRIVATE atlas_core)

    target_compile_options(test_csv_errors PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME csv_error_handling
        COMMAND test_csv_errors
    )
endif()

if(BUILD_TESTING)
    add_executable(test_date_validator
        tests/test_date_validator.cpp
    )

    target_link_libraries(test_date_validator PRIVATE atlas_core)

    target_compile_options(test_date_validator PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME date_validation
        COMMAND test_date_validator
    )
endif()

if(BUILD_TESTING)
    add_executable(test_csv_chronology
        tests/test_csv_chronology.cpp
    )

    target_link_libraries(test_csv_chronology PRIVATE atlas_core)

    target_compile_options(test_csv_chronology PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME csv_chronology
        COMMAND test_csv_chronology
    )
endif()

add_executable(benchmark_csv
    benchmarks/benchmark_csv.cpp
)

target_link_libraries(benchmark_csv PRIVATE atlas_core)

target_compile_options(benchmark_csv PRIVATE
    -Wall -Wextra -Wpedantic
)

add_executable(benchmark_large_csv
    benchmarks/benchmark_large_csv.cpp
)

target_link_libraries(benchmark_large_csv PRIVATE atlas_core)

target_compile_options(benchmark_large_csv PRIVATE
    -Wall -Wextra -Wpedantic
)

add_executable(benchmark_capacity
    benchmarks/benchmark_capacity.cpp
)

target_link_libraries(benchmark_capacity PRIVATE atlas_core)

target_compile_options(benchmark_capacity PRIVATE
    -Wall -Wextra -Wpedantic
)

add_executable(benchmark_capacity_memory
    benchmarks/benchmark_capacity_memory.cpp
)

target_link_libraries(benchmark_capacity_memory PRIVATE atlas_core)

target_compile_options(benchmark_capacity_memory PRIVATE
    -Wall -Wextra -Wpedantic
)

# Optional CPU profiling workload.
option(ATLAS_BUILD_PROFILING
    "Build CPU profiling tools"
    OFF
)

if(ATLAS_BUILD_PROFILING)
    add_executable(profile_csv
        benchmarks/profile_csv.cpp
    )

    target_link_libraries(profile_csv PRIVATE atlas_core)

    target_compile_options(profile_csv PRIVATE
        -Wall -Wextra -Wpedantic
    )
endif()

if(BUILD_TESTING)
    add_executable(test_csv_columns
        tests/test_csv_columns.cpp
    )

    target_link_libraries(test_csv_columns PRIVATE atlas_core)

    target_compile_options(test_csv_columns PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME csv_column_validation
        COMMAND test_csv_columns
    )
endif()

# Optional isolated CSV splitting benchmark.
option(ATLAS_BUILD_MICROBENCHMARKS
    "Build isolated microbenchmarks"
    OFF
)

if(ATLAS_BUILD_MICROBENCHMARKS)
    add_executable(benchmark_split
        benchmarks/benchmark_split.cpp
    )

    target_compile_options(benchmark_split PRIVATE
        -Wall -Wextra -Wpedantic
    )
endif()

# Phase 2: historical replay correctness tests.
if(BUILD_TESTING)
    add_executable(test_historical_replay
        tests/test_historical_replay.cpp
    )

    target_link_libraries(
        test_historical_replay PRIVATE atlas_core
    )

    target_compile_options(test_historical_replay PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME historical_replay
        COMMAND test_historical_replay
    )
endif()

# Phase 2: verify strategy signals and reset behavior.
if(BUILD_TESTING)
    add_executable(test_strategy
        tests/test_strategy.cpp
    )

    target_link_libraries(test_strategy PRIVATE atlas_core)

    target_compile_options(test_strategy PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME strategy_signals
        COMMAND test_strategy
    )
endif()

# Phase 2: test strategy evaluation and deterministic replay.
if(BUILD_TESTING)
    add_executable(test_backtest_runner
        tests/test_backtest_runner.cpp
    )

    target_link_libraries(
        test_backtest_runner PRIVATE atlas_core
    )

    target_compile_options(test_backtest_runner PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME backtest_runner
        COMMAND test_backtest_runner
    )
endif()

# Phase 2: verify moving-average crossover signals.
if(BUILD_TESTING)
    add_executable(test_sma_strategy
        tests/test_sma_strategy.cpp
    )

    target_link_libraries(test_sma_strategy PRIVATE atlas_core)

    target_compile_options(test_sma_strategy PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME sma_crossover
        COMMAND test_sma_strategy
    )
endif()

# Phase 2: standalone demonstration of strategy signals.
add_executable(atlas_backtest_demo
    src/backtest_demo.cpp
)

target_link_libraries(atlas_backtest_demo PRIVATE atlas_core)

target_compile_options(atlas_backtest_demo PRIVATE
    -Wall -Wextra -Wpedantic
)

# Phase 2: verify exported signal CSV content and errors.
if(BUILD_TESTING)
    add_executable(test_signal_exporter
        tests/test_signal_exporter.cpp
    )

    target_link_libraries(
        test_signal_exporter PRIVATE atlas_core
    )

    target_compile_options(test_signal_exporter PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME signal_exporter
        COMMAND test_signal_exporter
    )
endif()


# Phase 2: deterministic portfolio accounting regression tests.
if(BUILD_TESTING)
    add_executable(test_portfolio_simulator
        tests/test_portfolio_simulator.cpp
    )

    target_link_libraries(
        test_portfolio_simulator PRIVATE atlas_core
    )

    target_compile_options(test_portfolio_simulator PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME portfolio_simulator
        COMMAND test_portfolio_simulator
    )
endif()


# Phase 2: demonstrate next-bar execution and portfolio returns.
add_executable(atlas_portfolio_demo
    src/portfolio_demo.cpp
)

target_link_libraries(
    atlas_portfolio_demo PRIVATE atlas_core
)

target_compile_options(atlas_portfolio_demo PRIVATE
    -Wall -Wextra -Wpedantic
)

# Phase 2: validate portfolio error handling and arithmetic safety.
if(BUILD_TESTING)
    add_executable(test_portfolio_robustness
        tests/test_portfolio_robustness.cpp
    )

    target_link_libraries(
        test_portfolio_robustness PRIVATE atlas_core
    )

    target_compile_options(test_portfolio_robustness PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME portfolio_robustness
        COMMAND test_portfolio_robustness
    )
endif()


# Phase 2: validate equity-based performance calculations.
if(BUILD_TESTING)
    add_executable(test_performance_metrics
        tests/test_performance_metrics.cpp
    )

    target_link_libraries(
        test_performance_metrics PRIVATE atlas_core
    )

    target_compile_options(test_performance_metrics PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME performance_metrics
        COMMAND test_performance_metrics
    )
endif()


# Phase 2: compare strategies using identical portfolio assumptions.
add_executable(atlas_strategy_comparison
    src/strategy_comparison.cpp
)

target_link_libraries(
    atlas_strategy_comparison PRIVATE atlas_core
)

target_compile_options(atlas_strategy_comparison PRIVATE
    -Wall -Wextra -Wpedantic
)

# Phase 2: verify portfolio JSON serialization and error handling.
if(BUILD_TESTING)
    add_executable(test_portfolio_json_exporter
        tests/test_portfolio_json_exporter.cpp
    )

    target_link_libraries(
        test_portfolio_json_exporter PRIVATE atlas_core
    )

    target_compile_options(test_portfolio_json_exporter PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME portfolio_json_exporter
        COMMAND test_portfolio_json_exporter
    )
endif()


# Phase 2: execute the C++ portfolio demo and verify its
# machine-readable JSON using an independent Python parser.
if(BUILD_TESTING)
    find_package(Python3 REQUIRED COMPONENTS Interpreter)

    add_test(
        NAME portfolio_json_integration
        COMMAND
            ${Python3_EXECUTABLE}
            ${PROJECT_SOURCE_DIR}/scripts/verify_portfolio_json.py
            --executable
            $<TARGET_FILE:atlas_portfolio_demo>
    )
endif()

# Phase 3: validate commission, slippage, and cash accounting.
if(BUILD_TESTING)
    add_executable(test_execution_costs
        tests/test_execution_costs.cpp
    )

    target_link_libraries(test_execution_costs
        PRIVATE atlas_core
    )

    target_compile_options(test_execution_costs PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME execution_costs
        COMMAND test_execution_costs
    )
endif()

# Phase 3: verify versioned portfolio cost serialization.
if(BUILD_TESTING)
    add_executable(test_portfolio_json_v2
        tests/test_portfolio_json_v2.cpp
    )

    target_link_libraries(test_portfolio_json_v2
        PRIVATE atlas_core
    )

    target_compile_options(test_portfolio_json_v2 PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME portfolio_json_v2
        COMMAND test_portfolio_json_v2
    )
endif()

# Phase 3: verify real C++ JSON v2 output against the
# committed frontend fixture and financial invariants.
if(BUILD_TESTING)
    find_package(Python3 REQUIRED COMPONENTS Interpreter)

    add_test(
        NAME portfolio_json_v2_integration
        COMMAND
            ${Python3_EXECUTABLE}
            ${CMAKE_SOURCE_DIR}/scripts/verify_portfolio_json_v2.py
            --executable $<TARGET_FILE:atlas_portfolio_demo>
            --fixture
            ${CMAKE_SOURCE_DIR}/frontend/public/data/demo_portfolio_v2.json
    )
endif()


# Phase 4: validate annualized volatility and Sharpe ratio.
if(BUILD_TESTING)
    add_executable(test_risk_analytics
        tests/test_risk_analytics.cpp
    )

    target_link_libraries(test_risk_analytics
        PRIVATE atlas_core
    )

    target_compile_options(test_risk_analytics PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME risk_analytics
        COMMAND test_risk_analytics
    )
endif()


# Phase 4.2: validate configurable portfolio entry allocation.
if(BUILD_TESTING)
    add_executable(test_position_sizing
        tests/test_position_sizing.cpp
    )

    target_link_libraries(test_position_sizing
        PRIVATE atlas_core
    )

    target_compile_options(test_position_sizing PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME position_sizing
        COMMAND test_position_sizing
    )
endif()


# Phase 4.2: validate entry-time portfolio exposure limits.
if(BUILD_TESTING)
    add_executable(test_exposure_limits
        tests/test_exposure_limits.cpp
    )

    target_link_libraries(test_exposure_limits
        PRIVATE atlas_core
    )

    target_compile_options(test_exposure_limits PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME exposure_limits
        COMMAND test_exposure_limits
    )
endif()


# Phase 4.3: verify close-observed drawdown safeguards.
if(BUILD_TESTING)
    add_executable(test_drawdown_controls
        tests/test_drawdown_controls.cpp
    )

    target_link_libraries(test_drawdown_controls
        PRIVATE atlas_core
    )

    target_compile_options(test_drawdown_controls PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME drawdown_controls
        COMMAND test_drawdown_controls
    )
endif()


# Phase 4.4: verify chronological risk-control event reporting.
if(BUILD_TESTING)
    add_executable(test_risk_events
        tests/test_risk_events.cpp
    )

    target_link_libraries(test_risk_events
        PRIVATE atlas_core
    )

    target_compile_options(test_risk_events PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME risk_events
        COMMAND test_risk_events
    )
endif()


# Phase 4.4: validate versioned portfolio risk reporting.
if(BUILD_TESTING)
    add_executable(test_portfolio_json_v3
        tests/test_portfolio_json_v3.cpp
    )

    target_link_libraries(test_portfolio_json_v3
        PRIVATE atlas_core
    )

    target_compile_options(test_portfolio_json_v3 PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME portfolio_json_v3
        COMMAND test_portfolio_json_v3
    )
endif()


# Phase 4.4: validate C++ JSON v3 with Python's JSON parser.
if(BUILD_TESTING)
    find_package(Python3 COMPONENTS Interpreter REQUIRED)

    add_executable(atlas_portfolio_json_v3_generator
        tests/portfolio_json_v3_generator.cpp
    )

    target_link_libraries(atlas_portfolio_json_v3_generator
        PRIVATE atlas_core
    )

    target_compile_options(
        atlas_portfolio_json_v3_generator PRIVATE
        -Wall -Wextra -Wpedantic
    )

    add_test(
        NAME portfolio_json_v3_integration
        COMMAND
            ${Python3_EXECUTABLE}
            ${CMAKE_SOURCE_DIR}/scripts/verify_portfolio_json_v3.py
            $<TARGET_FILE:atlas_portfolio_json_v3_generator>
    )
endif()
