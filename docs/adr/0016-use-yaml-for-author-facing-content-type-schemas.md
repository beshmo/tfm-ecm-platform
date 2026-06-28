# ADR-0016: Use YAML For Author-Facing Content Type Schemas

## Status

Accepted

## Context

ECMP uses schema-driven content definitions. Content type schemas may be maintained by developers or administrators and should be readable, easy to review, and suitable for documentation.

The platform also needs deterministic validation, API contracts, persistence, and tests. REST APIs, TypeScript, and MongoDB naturally work with JSON-compatible data structures.

## Decision

ECMP will use YAML for author-facing content type schema definition files.

The platform will parse YAML schemas and convert them internally into a strict JSON-compatible schema model. Validation, persistence, API contracts, and tests should use the normalized JSON-compatible representation.

## Consequences

YAML keeps manually maintained schema files readable and allows comments in schema definitions. This is useful for documenting field intent, validation rules, and examples.

The implementation must use strict parsing and validation to avoid YAML ambiguity, indentation mistakes, and implicit type coercion surprises.

JSON remains the format for REST API payloads, MongoDB documents, internal DTOs, and contract tests.

This approach combines YAML readability with JSON determinism.

