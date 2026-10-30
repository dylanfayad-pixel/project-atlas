# 21 — Cloud Deployment with Railway and Vercel

## What is Cloud Deployment?

Cloud deployment makes an application available through
managed computing and networking infrastructure.

Atlas separates its frontend from its computation service.

## Planned Atlas Deployment

- Vercel: React frontend and Node API gateway.
- Railway: Containerized Python and C++ backend.
- HTTPS: Encrypted communication between services.
- Environment variables: Runtime configuration and secrets.

## Atlas Deployment Files

- Dockerfile
- .dockerignore
- railway.json
- frontend/api/backtest.ts

## Important Configuration

Backend:

- ATLAS_BACKTEST_ENV
- ATLAS_BACKTEST_SERVICE_KEY
- ATLAS_BACKTEST_HOST
- PORT

Gateway:

- ATLAS_BACKTEST_URL
- ATLAS_BACKTEST_SERVICE_KEY

Production credentials must never be committed to Git.

## Deployment Verification

A successful deployment requires:

1. Container startup.
2. Healthy backend endpoint.
3. Unauthorized request rejection.
4. Authorized backtest execution.
5. Valid financial response.
6. Successful public frontend execution.

## Current Status

Railway configuration exists locally.

Public production deployment is pending.

## Interview Questions

1. Why separate frontend and backend hosting?
2. What is a deployment health check?
3. How should production secrets be managed?
4. How do you roll back a failed deployment?

## Additional Learning

Video search: Railway Docker deployment tutorial.

References:
- https://docs.railway.com/
- https://vercel.com/docs
