# 19 — HTTP Services and API Gateways

## What is an API Gateway?

An API gateway accepts client requests and forwards
approved operations to backend services.

It can enforce authentication, input limits,
timeouts, routing, and response validation.

## Atlas Request Flow

```text
React Browser
    |
    v
POST /api/backtest
    |
    v
Node.js Gateway
    |
    v
Python HTTP Adapter
    |
    v
C++ Backtesting CLI
```

The browser never invokes the C++ executable directly.

## Important HTTP Status Codes

- 200: Successful request.
- 400: Invalid request.
- 401: Unauthorized.
- 404: Route not found.
- 413: Request too large.
- 422: Execution rejected.
- 503: Service unavailable.
- 504: Execution timeout.

## Atlas Implementation

The gateway is implemented in:

`frontend/api/backtest.ts`

The Python adapter is implemented in:

`services/backtest/server.py`

The gateway validates successful financial responses
before returning them to the browser.

## Why Use a Same-Origin Endpoint?

A same-origin API avoids exposing backend configuration
to browser JavaScript and simplifies routing.

It does not automatically prevent abuse.

## Interview Questions

1. What does an API gateway do?
2. Why separate HTTP handling from C++ calculations?
3. What is the difference between 400 and 422?
4. Why validate backend responses?

## Additional Learning

Video search: HTTP APIs and reverse proxies explained.

Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP
