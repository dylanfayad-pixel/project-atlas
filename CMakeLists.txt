cmake_minimum_required(VERSION 3.20)

project(
    ProjectAtlas
    VERSION 0.1.0
    DESCRIPTION "High-Performance Quantitative Trading and Backtesting Engine"
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(atlas_core STATIC
    src/csv_reader.cpp
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

include(CTest)

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
