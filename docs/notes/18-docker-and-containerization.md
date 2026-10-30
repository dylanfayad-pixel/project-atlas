# 18 — Docker and Containerization

## What is Docker?

Docker packages applications and their runtime dependencies
into images that can run as isolated containers.

An image is a reusable filesystem and configuration.
A container is a running instance of an image.

## How Atlas Uses Docker

Atlas uses a multi-stage Dockerfile:

1. Compile the C++20 backtesting CLI.
2. Copy the executable into a smaller Python runtime.
3. Run the service using a non-root user.
4. Expose the HTTP service on the configured port.

The build stage includes compilers and CMake.
The runtime stage does not need the complete build toolchain.

## Important Concepts

- Image: Packaged application and dependencies.
- Container: Running image instance.
- Layer: Reusable image filesystem component.
- Multi-stage build: Separates compilation and runtime.
- Health check: Determines whether the service responds.
- Read-only filesystem: Restricts runtime filesystem writes.
- Resource limits: Bound CPU and memory consumption.

## Atlas Commands

```bash
sudo docker build -t atlas-backtest:dev .
sudo docker image ls
sudo docker ps -a
```

Run the reproducible smoke test:

```bash
sudo python3 scripts/test_backtest_container.py
```

## Security Considerations

Containers are not complete security boundaries.

Atlas additionally uses non-root execution, dropped
capabilities, resource limits, and service authentication.

## Interview Questions

1. Why use a multi-stage Docker build?
2. What is the difference between an image and a container?
3. Why run containers as non-root?
4. Why are health checks important?

## Additional Learning

Video search: Docker official getting started tutorial.

Official documentation: https://docs.docker.com/get-started/
