# ADR-0013: Use Docker Compose And Kubernetes Namespace `ecmp`

## Status

Accepted

## Context

The platform needs a local development shape and a Kubernetes reference deployment shape.

## Decision

Docker Compose will be used for local development.

All ECMP Kubernetes resources will be deployed into the `ecmp` namespace.

Management and Delivery filesystem storage will use separate persistent volumes and persistent volume claims in Kubernetes.

## Consequences

Local development can start all services and dependencies with one tool. Kubernetes resources have a clear namespace boundary. File storage must be explicitly provisioned and mounted for Management and Delivery.

