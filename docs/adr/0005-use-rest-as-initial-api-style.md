# ADR-0005: Use REST As The Initial API Style

## Status

Accepted

## Context

The initial platform needs clear API contracts for content CRUD, folder CRUD, content type CRUD, file metadata, publication requests, unpublication requests, authentication, and delivery retrieval.

## Decision

REST will be the initial and primary API style.

GraphQL may be considered later as a future enhancement, but it is not part of the initial architecture.

## Consequences

REST keeps the first implementation straightforward, easy to test with API contract tests, and familiar for portfolio review. Endpoint design must be maintained carefully as the platform grows.

