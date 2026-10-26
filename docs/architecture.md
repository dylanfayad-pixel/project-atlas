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

## CSV Reader Capacity Management

### API

The CSV reader supports an optional capacity hint:

```cpp
static std::vector<MarketBar> read(
    const std::string& filepath,
    std::size_t capacity_hint = 0
);
```

A caller can provide an estimated record count:

```cpp
auto bars = atlas::CsvReader::read(
    "data/benchmark_100k.csv",
    100000
);
```

### Implementation

The reader stores validated market records in a
`std::vector<MarketBar>`.

When `capacity_hint` is greater than zero, it calls
`bars.reserve(capacity_hint)` before appending records.

Without a hint, the vector grows dynamically.

The hint does not change parsing, validation, chronological
ordering, or duplicate timestamp detection.

### Design Tradeoffs

Advantages:

- Potentially fewer vector reallocations
- Reduced movement of existing MarketBar objects
- Potential improvements in execution time and memory usage
- Backward-compatible default behavior

Limitations:

- The caller must estimate the record count
- Excessive hints can waste allocated memory
- Reservation does not guarantee faster execution
- The reader still loads the complete dataset into memory
- The API does not currently support streaming ingestion

### Performance Evidence

On the tested 100,000-record synthetic dataset:

- Median execution-time reduction: 4.69%
- Median peak RSS reduction: approximately 20.9%

These are workload-specific observations, not universal
performance guarantees.

See [Performance Benchmarks](performance.md) for methodology.
