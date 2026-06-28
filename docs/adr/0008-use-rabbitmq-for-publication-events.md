# ADR-0008: Use RabbitMQ For Publication Events

## Status

Accepted

## Context

Publication and unpublication should be asynchronous. The Publication Service needs to emit requests that the Publication Worker can consume independently.

## Decision

ECMP will use RabbitMQ for publication and unpublication events.

## Consequences

RabbitMQ decouples request handling from publication execution and supports worker-based processing. The architecture must handle idempotency, manual retry, failure states, correlation IDs, and event payload versioning.

