# ADR-0003: Use Standalone Angular Feature Areas

## Status

Accepted

## Context

The frontend should follow clean architecture principles without creating unnecessary Angular NgModules or empty architecture folders.

## Decision

The Management Frontend will use standalone Angular components and route-based feature areas. New features should not use Angular NgModules unless a future library or third-party integration requires it.

Business capability features may contain `domain`, `application`, `infrastructure`, and `presentation` folders where needed. The `folder-explorer` feature is a composition feature and does not own folder, content, file, or publication domain rules.

## Consequences

The frontend remains aligned with modern Angular patterns while preserving domain-driven boundaries. Feature code can stay focused and testable without unnecessary module ceremony.

