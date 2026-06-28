# ADR-0009: Use Projection-Based Publication

## Status

Accepted

## Context

Published content should not be a direct copy of authoring content because Management records may contain workflow state, permissions, and metadata that do not belong in Delivery.

## Decision

ECMP will use projection-based publication.

The first projection will remain simple and preserve validated content data unless delivery-specific transformation is required.

## Consequences

Delivery models can be optimized for read access and evolve independently from Management models. Publication logic becomes a clear transformation step that requires tests and idempotency.

