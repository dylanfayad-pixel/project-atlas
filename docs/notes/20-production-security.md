# 20 — Production Security

## Defense in Depth

Production security uses multiple independent controls.

Atlas protects the execution service through
authentication, input validation, resource limits,
timeouts, and controlled network exposure.

## Service Authentication

The gateway forwards a server-side credential using:

`X-Atlas-Service-Key`

The backend compares the supplied credential with
the configured expected value.

Production startup requires a sufficiently long key.

## Important Concepts

- Authentication: Verifying an authorized caller.
- Authorization: Determining permitted operations.
- TLS: Encrypting network communication.
- Rate limiting: Restricting request frequency.
- SSRF: Server-side requests to unintended destinations.
- Least privilege: Granting minimal necessary access.
- Secret management: Protecting credentials.

## Current Atlas Controls

- Production credential enforcement.
- Constant-time credential comparison.
- Bounded request sizes.
- Backend execution timeouts.
- Restricted execution concurrency.
- Gateway redirect rejection.
- Runtime financial response validation.

## Remaining Production Requirements

- Distributed rate limiting.
- Verified HTTPS backend deployment.
- Production secret configuration.
- Hosting-level traffic controls.
- Additional adversarial security testing.

## Interview Questions

1. Why must production fail closed?
2. Why should credentials remain server-side?
3. Why is hostname filtering insufficient against SSRF?
4. Why is in-memory rate limiting unreliable in serverless systems?

## Additional Learning

Video search: OWASP API security fundamentals.

Reference: https://owasp.org/API-Security/
