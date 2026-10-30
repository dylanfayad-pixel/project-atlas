# Stage 1: Compile the Atlas C++20 engine.
FROM debian:bookworm-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    cmake g++ make python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY CMakeLists.txt ./
COPY include/ ./include/
COPY src/ ./src/
COPY tests/ ./tests/
COPY benchmarks/ ./benchmarks/

RUN cmake -S . -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_TESTING=OFF && \
    cmake --build build \
    --target atlas_backtest_cli \
    --parallel 2

# Stage 2: Minimal Python runtime.
FROM python:3.13-slim AS runtime

WORKDIR /app

COPY --from=builder \
    /app/build/atlas_backtest_cli \
    /app/bin/atlas_backtest_cli

COPY services/backtest/server.py \
    /app/services/backtest/server.py

RUN useradd --system --create-home atlas && \
    chown -R atlas:atlas /app

USER atlas

ENV ATLAS_BACKTEST_BINARY=/app/bin/atlas_backtest_cli
ENV ATLAS_BACKTEST_HOST=0.0.0.0
ENV PORT=8765
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8765

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/health', timeout=2).close()" || exit 1

CMD ["python", "-u", "services/backtest/server.py"]
