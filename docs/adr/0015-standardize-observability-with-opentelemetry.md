# ADR-0015: Standardize Observability With OpenTelemetry

## Status

Accepted

## Context

Every ECMP service should emit telemetry consistently regardless of framework or implementation details.

## Decision

ECMP will use OpenTelemetry as the common instrumentation standard for metrics and distributed tracing.

Services must emit structured JSON logs, propagate `X-Correlation-ID`, follow consistent metric naming, and trace HTTP entry points, message consumption, scheduled jobs, external calls, and significant business operations.

## Consequences

Observability will be consistent across services and publication workflows. Developers must include logging, metrics, tracing, and correlation propagation as part of service implementation rather than treating them as optional extras.

