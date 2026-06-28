# ADR-0012: Use JWT Authentication With RBAC Permissions

## Status

Accepted

## Context

The Management Frontend needs authenticated access, minimal roles, resource-action permissions, and clear endpoint authorization rules.

## Decision

ECMP will use username/password login, signed JWT access tokens, refresh tokens, and role-based access control with `resource:action` permissions.

Initial roles are Admin, Creator, Reviewer, and Publisher.

## Consequences

The platform has a clear security model for frontend routes and REST endpoints. Access tokens remain short-lived and stateless, while refresh tokens require server-side storage, rotation, and revocation.

