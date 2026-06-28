# ADR-0014: Define Layered Testing Targets

## Status

Accepted

## Context

ECMP is intended to demonstrate test-driven development and clean architecture. Different layers have different risk levels and testing costs.

## Decision

ECMP will use minimum testing targets by layer:

| Layer | Minimum target |
| --- | --- |
| Domain unit tests | 100% |
| Application use case tests | 100% |
| Service integration tests | 30% |
| API contract tests | 100% |
| Angular component/integration tests | 20% |
| Playwright E2E workflows | 10% |

## Consequences

Business rules, use cases, and API contracts must be fully covered. More expensive tests start with lower targets and focus on critical workflows.

