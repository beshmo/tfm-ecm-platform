# ADR-0001: Use Microservices From The Beginning

## Status

Accepted

## Context

ECMP is a TFM academic and portfolio project intended to demonstrate enterprise architecture, independent service boundaries, asynchronous publication, and cloud-native deployment.

## Decision

ECMP will use a microservices architecture from the beginning.

Initial services include the API Gateway, Identity Service, Content Service, Content Type Service, Publication Service, Publication Worker, and Delivery Service.

## Consequences

Services can be developed, tested, deployed, and scaled independently. The architecture better demonstrates enterprise and cloud-native concerns, but it increases local development, testing, and operational complexity compared with a modular monolith.

