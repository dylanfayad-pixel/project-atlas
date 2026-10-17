#include <iostream>
#include <string_view>

int main() {
    constexpr std::string_view project_name = "Project Atlas";

    std::cout << "================================\n";
    std::cout << project_name << '\n';
    std::cout << "Quantitative Trading Engine\n";
    std::cout << "================================\n";
    std::cout << "System initialized successfully.\n";

    return 0;
}
