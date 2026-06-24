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
* Use a microservices architecture from the beginning.
* Support horizontal scaling through stateless application services.
* Use schema-driven content definitions.
* Enable asynchronous publishing and unpublishing operations.
* Separate content authoring from public content delivery.
* Follow cloud-native and Twelve-Factor application principles.
* Provide a clear academic and professional portfolio case study.

## High-Level Architecture

ECMP separates content management from content delivery. Authors use a Management Frontend to create, edit, approve, publish, and unpublish content in the Management Stage. Public consumers read published content from the Delivery Stage. Publication between both stages is asynchronous and event-driven.

```text
+--------------------------------------------------+
|                 Management Stage                 |
+--------------------------------------------------+

        +-----------------------+
        | Management Frontend   |
        +-----------+-----------+
                    |
                    v
        +-----------------------+
        | API Gateway           |
        +-----------+-----------+
                    |
                    v
        +-----------------------+
        | Management API        |
        +-----------+-----------+
                    |
                    v
              MongoDB
        (Authoring Content)
                    |
                    v
             Publish Request
                    |
                    v
              RabbitMQ
                    |
                    v
+--------------------------------------------------+
|                  Delivery Stage                  |
+--------------------------------------------------+

        +-----------------------+
        | Publication Worker    |
        +-----------+-----------+
                    |
                    v
              MongoDB
        (Published Content)
                    |
                    v
              Delivery API
```

The exact physical separation between Management and Delivery storage is still under review. The implementation may use separate databases, separate collections, or separate MongoDB instances depending on the final design.

## Planned Monorepo Structure

The project will use a single repository with multiple independently deployable services.

```text
ecmp-platform/
|-- apps/
|   `-- management-frontend/
|       `-- src/app/
|           |-- core/
|           |-- shared/
|           `-- features/
|               |-- content/
|               |-- content-types/
|               `-- publication/
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

Each application and service will be built and deployed independently while sharing common packages for types, events, authentication, and YAML handling.

## Planned Frontend

### Management Frontend

The Management Frontend is the user interface for authenticated content authors and administrators.

Responsibilities:

* Authenticate users through the platform identity flow.
* Manage content types where permitted.
* Create, read, update, and delete content instances.
* Upload and manage file content metadata.
* Request content publication and unpublication.
* Display content lifecycle status.
* Surface validation errors from the backend APIs.

The frontend will communicate with backend services through the API Gateway. It will not access MongoDB, Redis, RabbitMQ, or filesystem storage directly.

Technology:

* Angular
* TypeScript
* Angular Router
* Angular Forms
* Angular HTTP Client

The Management Frontend will follow the same architectural principles as the backend. Feature areas should be organized around business capabilities, such as content, content types, and publication.

Planned feature structure:

```text
features/content/
|-- domain/
|-- application/
|-- infrastructure/
`-- presentation/
```

Layer responsibilities:

| Layer | Responsibility |
| --- | --- |
| Domain | Content entities, value objects, domain rules, and lifecycle constraints. |
| Application | Use cases such as creating content, updating content, publishing content, and unpublishing content. |
| Infrastructure | REST clients, DTO mapping, and API gateway communication. |
| Presentation | Angular components, pages, forms, view models, and UI state. |

## Planned Microservices

### API Gateway

Single entry point for the Management Frontend and external API clients.

Responsibilities:

* Routing
* Authentication integration
* Rate limiting
* Request forwarding to internal services

### Identity Service

Handles authentication, authorization, and session management.

Storage:

* Redis for session data

### Content Service

Manages content instances.

Responsibilities:

* Content CRUD operations
* Content validation
* Content lifecycle management
* Versioning support in future phases

Storage:

* MongoDB for content metadata and structured content
* Filesystem-backed storage for binary files

### Content Type Service

Manages content schemas.

Responsibilities:

* Content type definition
* Schema validation
* YAML schema parsing

Storage:

* MongoDB

### Publication Service

Coordinates publication and unpublication requests created from the Management Frontend.

Responsibilities:

* Publication request handling
* Unpublication request handling
* Event generation
* Publication state tracking

Dependencies:

* RabbitMQ
* MongoDB

### Publication Worker

Consumes publication events and synchronizes content between Management and Delivery stages.

Responsibilities:

* Event consumption
* Publish and unpublish execution
* Delivery stage synchronization

Dependencies:

* RabbitMQ
* MongoDB

### Delivery Service

Provides public read-only content APIs.

Responsibilities:

* Published content retrieval
* Public REST endpoints
* High-performance read operations

Storage:

* Delivery MongoDB or delivery-specific MongoDB collections, pending final design

## Content Model

ECMP uses a schema-driven content architecture. Content types are defined as YAML schemas, and content instances are validated against those schemas before being stored.

Example content type definition:

```yaml
name: generic
version: 1.0

fields:
  title:
    type: string
    required: true

  description:
    type: text

  publishDate:
    type: datetime
```

Content type schemas define:

* Allowed fields
* Field data types
* Validation rules
* Required fields
* Extensibility rules

## Initial Content Types

The first platform version will support two content types.

### Generic Content

Generic content represents structured editorial content.

Example use cases:

* Articles
* Landing pages
* Product descriptions
* Corporate information

Example:

```yaml
id: article-001
type: generic
title: Welcome
description: First article
publishDate: 2026-06-01
```

### File Content

File content represents binary assets. The binary file will be stored in a configured filesystem-backed storage location, while metadata will be stored in MongoDB.

Example use cases:

* PDFs
* Images
* Documents
* Videos

Example metadata:

```yaml
id: file-001
type: file
filename: manual.pdf
mimeType: application/pdf
size: 124500
path: /content/files/manual.pdf
```

## Content Lifecycle

Content will move through the following lifecycle states:

| State | Description |
| --- | --- |
| Draft | Content is being edited. |
| Approved | Content is ready for publication. |
| Publishing | A publication request is being processed. |
| Published | Content is available in the Delivery Stage. |
| Unpublished | Content has been removed from the Delivery Stage. |
| Archived | Content remains stored but is no longer active. |

## Publication Workflow

Publication must be asynchronous.

Publishing process:

1. An author requests publication.
2. The content status changes to `Publishing`.
3. A publication event is sent to RabbitMQ.
4. The Publication Worker consumes the event.
5. The content is copied or synchronized into the Delivery Stage.
6. The content status changes to `Published`.

Unpublishing process:

1. An author requests unpublication.
2. An unpublication event is sent to RabbitMQ.
3. The Publication Worker consumes the event.
4. The content is removed from the Delivery Stage.
5. The content status changes to `Unpublished`.

Example events:

```text
content.publish.requested
content.published
content.unpublish.requested
content.unpublished
```

## Data Storage

| Component | Storage |
| --- | --- |
| Structured content | MongoDB |
| Content type schemas | MongoDB |
| File metadata | MongoDB |
| Binary files | Filesystem-backed storage path or mounted volume |
| Sessions | Redis |
| Cache | Redis |
| Publication events | RabbitMQ |

### Content Collection

```json
{
  "_id": "...",
  "contentId": "...",
  "contentType": "generic",
  "status": "published",
  "version": 1,
  "data": {}
}
```

### Content Type Collection

```json
{
  "_id": "...",
  "name": "generic",
  "version": "1.0",
  "schema": {}
}
```

### File Metadata

```json
{
  "_id": "...",
  "contentId": "file-001",
  "filename": "manual.pdf",
  "mimeType": "application/pdf",
  "size": 124500,
  "path": "/content/files/manual.pdf"
}
```

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
| File storage | Filesystem |
| Containerization | Docker |
| Orchestration | Kubernetes |
| API | REST |
| Schema definition | YAML |
| Content definition | YAML |

REST will be the initial and primary API style. GraphQL may be considered later as a future enhancement.

## Testing Strategy

The project will follow a test-driven development approach where practical, especially for domain rules, application use cases, validation logic, and publication workflows.

Planned testing tools:

| Test type | Tooling |
| --- | --- |
| Frontend unit tests | Vitest and Angular testing utilities |
| Frontend integration tests | Vitest, Angular testing utilities, and mocked HTTP clients |
| Frontend end-to-end tests | Playwright |
| Backend unit tests | Vitest or Jest, pending backend scaffold decision |
| Backend integration tests | Test containers or local infrastructure dependencies, pending implementation |
| API end-to-end tests | Playwright or dedicated HTTP-based test suites |

Frontend test coverage should include:

* Domain rules and value objects.
* Application use cases.
* DTO and API response mapping.
* Angular components and forms.
* Validation error handling.
* Content CRUD flows.
* Publish and unpublish flows.

## Cloud-Native Principles

ECMP is designed around cloud-native application principles:

* Services are stateless.
* Runtime state is externalized.
* Services are packaged as Linux containers.
* Configuration is provided through environment variables.
* Logs are written to stdout and stderr.
* Services are independently deployable.
* Scaling is performed by increasing service replicas.
* Kubernetes is the target deployment platform.

## Twelve-Factor Alignment

The platform will follow the Twelve-Factor App methodology where applicable:

| Factor | ECMP Approach |
| --- | --- |
| Codebase | One Git repository for all services and shared packages. |
| Dependencies | Explicit dependencies per service or package. |
| Configuration | Environment variables for runtime configuration. |
| Backing services | MongoDB, Redis, RabbitMQ, and filesystem-backed storage treated as attached resources. |
| Build, release, run | CI/CD will separate build, release, and runtime concerns. |
| Processes | Services run as stateless processes. |
| Port binding | Services expose HTTP APIs through network ports. |
| Concurrency | Scaling is achieved through replicas. |
| Disposability | Services support fast startup and graceful shutdown. |
| Dev/prod parity | Development and production should remain as similar as possible. |
| Logs | Logs are emitted to stdout and stderr. |
| Admin processes | Administrative tasks run as one-off processes. |

## Kubernetes Deployment Model

The reference deployment platform is Kubernetes.

Planned workloads:

```text
management-frontend
api-gateway
identity-service
content-service
content-type-service
publication-service
publication-worker
delivery-service
```

Deployment goals:

* Multiple replicas for stateless services.
* Horizontal Pod Autoscaling where useful.
* Graceful shutdown for services and workers.
* Queue-aware scaling for publication workers.
* Health checks and readiness probes.
* Externalized configuration through Kubernetes resources.

## Observability

Observability is a core requirement.

Planned capabilities:

* Structured JSON logs
* Correlation IDs
* Trace IDs
* Metrics collection
* Request latency tracking
* Publication latency tracking
* RabbitMQ queue depth monitoring

OpenTelemetry is planned for metrics and distributed tracing.

## Non-Functional Requirements

| Requirement | Description |
| --- | --- |
| Scalability | Services must support horizontal scaling. |
| Availability | No critical service should depend on a single running instance. |
| Performance | Delivery APIs should provide low-latency read access. |
| Security | Role-based access control will protect management operations and frontend access. |
| Usability | Content authors should be able to perform CRUD and publish or unpublish operations through the frontend. |
| Observability | Logs, metrics, and traces must support troubleshooting. |
| Extensibility | New content types should be introduced without application code changes. |
| Portability | The platform should run in local containers and Kubernetes environments. |

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
* Add Docker support for local development.
* Add basic CI checks.
* Add the initial frontend unit test setup.

### Phase 3 - Core Content Management

* Implement content type schemas.
* Implement content validation.
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
* Add observability basics.
* Document local and Kubernetes deployment.

## Future Enhancements

Possible future improvements include:

* Full content versioning
* Advanced approval workflows
* OpenSearch integration
* GraphQL API
* Multi-site support
* AI-assisted content metadata enrichment
* Semantic search
* Content recommendations

## Quick Start

Implementation instructions will be added once the first services are scaffolded.

## License

This project is released under the Apache License 2.0. See [LICENSE](LICENSE) for details.
