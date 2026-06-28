# TFM - Enterprise Content Management Platform (ECMP)

ECMP is a cloud-native Enterprise Content Management Platform designed as the final project for a TFM academic work. The repository will contain the platform implementation, but the project is currently in the architecture and specification phase.

The goal is to build a portfolio-ready system that demonstrates enterprise architecture, microservices, frontend-driven content management, asynchronous publication workflows, containerized deployment, and Kubernetes-oriented operations.

## Current Status

This project is not implemented yet.

At this stage, the repository contains the initial architectural definition and project direction. Source code, service scaffolding, infrastructure manifests, and development instructions will be added in later phases.

## Objectives

The main objectives of ECMP are:

* Provide enterprise-grade content management capabilities.
* Provide a frontend for content authors and administrators.
* Organize content instances in hierarchical folders.
* Use a microservices architecture from the beginning.
* Support horizontal scaling through stateless application services.
* Use schema-driven content definitions.
* Enable asynchronous publishing and unpublishing operations.
* Separate content authoring from public content delivery.
* Follow cloud-native and Twelve-Factor application principles.
* Provide a clear academic and professional portfolio case study.

## Documentation

Detailed technical documentation lives in the `docs` directory:

* [Architecture](docs/architecture.md)

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular |
| Language | TypeScript |
| Runtime | Node.js |
| Backend framework | NestJS |
| Frontend framework | Angular |
| Database | MongoDB |
| Cache | Redis |
| Messaging | RabbitMQ |
| File storage | Filesystem-backed storage |
| Containerization | Docker |
| Orchestration | Kubernetes |
| API | REST |
| Schema definition | YAML |
| Content definition | YAML |

REST will be the initial and primary API style. GraphQL may be considered later as a future enhancement.

## Planned Repository Structure

```text
ecmp-platform/
|-- apps/
|   `-- management-frontend/
|
|-- services/
|   |-- api-gateway/
|   |-- identity-service/
|   |-- content-service/
|   |-- content-type-service/
|   |-- publication-service/
|   |-- publication-worker/
|   `-- delivery-service/
|
|-- packages/
|   |-- shared-types/
|   |-- shared-events/
|   |-- shared-auth/
|   `-- shared-yaml/
|
|-- infrastructure/
|   |-- kubernetes/
|   |-- helm/
|   |-- docker/
|   `-- terraform/
|
|-- docs/
`-- .github/
```

## Roadmap

### Phase 1 - Specification

* Define the architecture.
* Define the initial content model.
* Define service responsibilities.
* Define the publication workflow.
* Decide the final Management and Delivery storage separation.

### Phase 2 - Project Scaffold

* Create the monorepo structure.
* Scaffold the Angular Management Frontend.
* Configure TypeScript and NestJS.
* Add shared packages.
* Add Docker Compose support for local development.
* Add basic CI checks.
* Add the initial frontend unit test setup.

### Phase 3 - Core Content Management

* Implement content type schemas.
* Implement content validation.
* Implement hierarchical folder management.
* Implement content CRUD operations.
* Connect the Management Frontend to content CRUD APIs.
* Implement file metadata management.
* Store binary files in the filesystem.
* Add frontend unit and integration tests for content management.

### Phase 4 - Publication Workflow

* Add RabbitMQ integration.
* Implement publication requests.
* Implement publish and unpublish actions in the Management Frontend.
* Implement the Publication Worker.
* Synchronize content into the Delivery Stage.
* Implement unpublishing.
* Add end-to-end tests for publish and unpublish flows.

### Phase 5 - Delivery and Deployment

* Implement the Delivery Service.
* Add Kubernetes manifests or Helm charts.
* Add Management and Delivery persistent file storage volumes.
* Add observability basics.
* Document local and Kubernetes deployment.

## Quick Start

Implementation instructions will be added once the first services are scaffolded.

## License

This project is released under the Apache License 2.0. See [LICENSE](LICENSE) for details.
