# ADR-0006: Use MongoDB For Content Storage

## Status

Accepted

## Context

ECMP uses schema-driven content definitions and stores flexible content instance data, content type schemas, document metadata, folder metadata, and published delivery projections.

## Decision

ECMP will use MongoDB for structured content storage.

## Consequences

MongoDB fits flexible schema-driven content and JSON-like documents. The architecture must still define validation, indexes, versioning, and ownership boundaries clearly so flexibility does not become accidental inconsistency.
