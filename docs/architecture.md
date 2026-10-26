# Architecture and implementation boundaries

## Current data path

`CsvReader::read(std::string filepath)` opens a file, checks the exact six-column header, reads lines with LF/CRLF support, splits on commas, converts four price fields and volume using `std::from_chars`, checks `YYYY-MM-DD` with `std::chrono::year_month_day`, enforces strictly increasing dates, validates OHLC values, and appends to `std::vector<MarketBar>`.

`include/atlas/market_bar.hpp`: record structure with string timestamp, `double` OHLC, and `std::uint64_t` volume.

`include/atlas/market_bar_validator.hpp`: nonempty timestamp, finite and positive prices, high/low/open/close relationships; zero volume permitted. Calendar validation is separate.

`include/atlas/date_validator.hpp`: validates exact ISO-style daily date format and calendar validity; not an exchange calendar.

`include/atlas/csv_reader.hpp` and `src/csv_reader.cpp`: file ingestion API and implementation; throws `std::runtime_error` on failures. The public API has **no capacity-hint parameter** in this snapshot.

`src/main.cpp`: prints startup banner only; does not invoke `CsvReader`.

`CMakeLists.txt`: `atlas_core` static library, `atlas` executable, five dedicated test executables plus startup test, and two separate benchmark executables.

## Design tradeoffs

- Entire CSV is loaded into memory; no streaming API.
- Prices are floating point; future order accounting should use a deliberate exact-price representation.
- `YYYY-MM-DD` lexical comparison is chronological only after format and date validation.
- No quote escaping, optional headers, flexible column order, blank rows, intraday times, exchange calendar, symbol field, or timezone support.
- No automatic capacity reservation, allocator instrumentation or proven optimization yet.
- Failure is exception-based; no structured diagnostic result or partial-success mode.

## Future architecture (not implemented)

Historical market data -> event replay -> strategy signals -> simulated order handling -> portfolio/risk accounting -> analytics. The future simulation must explicitly prevent look-ahead bias, define execution timing, costs and slippage, and track reproducibility.
