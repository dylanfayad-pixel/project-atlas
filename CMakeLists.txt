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

add_executable(atlas src/main.cpp)

target_compile_options(atlas PRIVATE
    -Wall
    -Wextra
    -Wpedantic
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
endif()
