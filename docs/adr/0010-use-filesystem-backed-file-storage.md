# ADR-0010: Use Filesystem-Backed File Storage

## Status

Accepted

## Context

The first implementation needs to store binary static files while keeping metadata in MongoDB. Object storage is not required for the initial academic phase.

## Decision

ECMP will use filesystem-backed file storage for binary files.

MongoDB will store file metadata and internal storage paths. Management and Delivery file storage will be separated.

## Consequences

The first implementation stays simple and easy to run locally. Kubernetes deployment requires persistent volumes for Management and Delivery file storage. A future implementation may replace filesystem storage with object storage if needed.

