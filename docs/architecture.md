# ECMP Architecture

This document describes the planned architecture for the Enterprise Content Management Platform (ECMP).

The architecture is still evolving. Open decisions are documented explicitly so they can be resolved during the specification phase.

## System Context

ECMP is intended to be used by authenticated internal users through the Management Frontend. The platform does not currently expose a public consumer-facing experience or public external API.

Human users:

| Actor | Description |
| --- | --- |
| Creator | Content author responsible for creating and editing draft content. |
| Reviewer | Content author responsible for reviewing content before publication. |
| Publisher | Content author responsible for requesting publication and unpublication. |
| Admin | Administrative user responsible for managing users, roles, and platform access. |

Application clients:

| Client | Access |
| --- | --- |
| Management Frontend | Used by content authors and admins over HTTPS. |
| Internal Management API clients | Internal platform clients only. |
| Internal Delivery API clients | Internal platform clients only. |

External systems:

| System | Purpose |
| --- | --- |
| MongoDB | Stores structured content, content schemas, publication state, published content, and file metadata. |
| Redis | Stores sessions and cache data. |
| RabbitMQ | Transports asynchronous publication and unpublication events. |
| Filesystem-backed storage | Stores binary file content through a configured storage path or mounted volume. |

Out of scope for the current architecture:

* Public consumers.
* Public external clients using the Delivery API.
* Public external clients using the Management API.

## High-Level Architecture

ECMP separates content management from content delivery. Content authors and admins use a Management Frontend over HTTPS to create, edit, approve, publish, and unpublish content in the Management Stage. Internal clients read published content from the Delivery Stage through internal APIs. Publication between both stages is asynchronous and event-driven.

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

Management and Delivery storage are separated at database level. The Management Stage stores authoring content in a management database, while the Delivery Stage stores published content in a delivery database.

Both databases may run on the same MongoDB instance in local or simple environments. For stronger operational isolation, they may also run on separate MongoDB instances.

## Planned Monorepo Structure

The project will use a single repository with multiple independently deployable applications and services.

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

## Management Frontend

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

### Service Boundaries

Each service owns a specific part of the domain model and should expose that ownership through its API. Other services may read or request changes through published APIs or events, but they should not directly modify another service's owned data.

| Service | Owns |
| --- | --- |
| Identity Service | Authentication, authorization, sessions, users, and role assignments. |
| Content Type Service | Content type schemas and schema validation rules. |
| Content Service | Content drafts, master records, content lifecycle state, and file metadata. |
| Publication Service | Publication and unpublication requests, publication state, and publication events. |
| Publication Worker | Execution of publication and unpublication events between Management and Delivery stages. |
| Delivery Service | Published read model access and internal delivery queries. |
| API Gateway | Request routing, edge authentication integration, and cross-cutting API concerns. |

Ownership rules:

* The Content Service is the source of truth for draft and master content records.
* The Content Type Service is the source of truth for schemas.
* The Publication Service is the source of truth for publication requests.
* The Delivery Service exposes published read models but does not own authoring content.
* The Identity Service is the source of truth for authentication, authorization, sessions, users, and roles.
* The Publication Worker updates Delivery storage only as part of a publication or unpublication event.

### Initial REST API Contracts

The initial REST API is internal to the platform and primarily consumed by the Management Frontend and internal platform clients. Endpoint paths may be exposed through the API Gateway, while service implementations remain independently deployable.

All management endpoints require authentication. Authorization rules will be refined in the security model, but the initial role intent is:

| Role | Initial access |
| --- | --- |
| Creator | Create and update draft content. |
| Reviewer | Read and review content before publication. |
| Publisher | Request publication and unpublication. |
| Admin | Manage users, roles, content types, and platform access. |

#### Content CRUD

Owned by the Content Service.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/management/contents` | List content records from the Management database. |
| `GET` | `/api/management/contents/{contentId}` | Retrieve a content record by ID. |
| `POST` | `/api/management/contents` | Create a new draft content record. |
| `PUT` | `/api/management/contents/{contentId}` | Replace an existing content record. |
| `PATCH` | `/api/management/contents/{contentId}` | Partially update an existing content record. |
| `DELETE` | `/api/management/contents/{contentId}` | Delete or archive a content record, depending on lifecycle rules. |

Initial create/update payload shape:

```json
{
  "contentType": "generic",
  "data": {
    "title": "Welcome",
    "description": "First article",
    "publishDate": "2026-06-01"
  }
}
```

#### Content Type CRUD

Owned by the Content Type Service.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/management/content-types` | List content type schemas. |
| `GET` | `/api/management/content-types/{name}` | Retrieve the latest version of a content type schema. |
| `GET` | `/api/management/content-types/{name}/versions/{version}` | Retrieve a specific content type schema version. |
| `POST` | `/api/management/content-types` | Create a new content type schema. |
| `PUT` | `/api/management/content-types/{name}/versions/{version}` | Replace an existing content type schema version. |
| `DELETE` | `/api/management/content-types/{name}/versions/{version}` | Delete or deactivate a content type schema version, depending on lifecycle rules. |

Initial create/update payload shape:

```json
{
  "name": "generic",
  "version": "1.0",
  "schema": {
    "fields": {
      "title": {
        "type": "string",
        "required": true
      }
    }
  }
}
```

#### File Metadata Upload and Update

Owned by the Content Service.

The binary file is stored in filesystem-backed storage. MongoDB stores metadata and the storage path.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/management/files` | Upload a binary file and create file metadata. |
| `GET` | `/api/management/files/{fileId}` | Retrieve file metadata by ID. |
| `PATCH` | `/api/management/files/{fileId}` | Update file metadata. |
| `DELETE` | `/api/management/files/{fileId}` | Delete or archive file metadata and the associated binary file according to lifecycle rules. |

Initial metadata response shape:

```json
{
  "fileId": "file-001",
  "filename": "manual.pdf",
  "mimeType": "application/pdf",
  "size": 124500,
  "path": "/content/files/manual.pdf"
}
```

#### Publish Request

Owned by the Publication Service.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/management/contents/{contentId}/publication-requests` | Request publication for a content record. |
| `GET` | `/api/management/publication-requests/{requestId}` | Retrieve publication request status. |

Initial request payload shape:

```json
{
  "requestedBy": "user-001",
  "reason": "Ready for publication"
}
```

Initial response shape:

```json
{
  "requestId": "pub-001",
  "contentId": "article-001",
  "type": "publish",
  "status": "requested"
}
```

#### Unpublish Request

Owned by the Publication Service.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/management/contents/{contentId}/unpublication-requests` | Request unpublication for a content record. |
| `GET` | `/api/management/unpublication-requests/{requestId}` | Retrieve unpublication request status. |

Initial request payload shape:

```json
{
  "requestedBy": "user-001",
  "reason": "Content should no longer be available"
}
```

Initial response shape:

```json
{
  "requestId": "unpub-001",
  "contentId": "article-001",
  "type": "unpublish",
  "status": "requested"
}
```

#### Delivery Content Retrieval

Owned by the Delivery Service.

Delivery endpoints are internal read-only APIs backed by the Delivery MongoDB database.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/delivery/contents` | List published content records from the Delivery database. |
| `GET` | `/api/delivery/contents/{contentId}` | Retrieve a published content record by ID. |
| `GET` | `/api/delivery/contents?contentType={contentType}` | List published content records by content type. |

Initial response shape:

```json
{
  "contentId": "article-001",
  "contentType": "generic",
  "version": 1,
  "publishedAt": "2026-06-01T10:00:00.000Z",
  "data": {
    "title": "Welcome",
    "description": "First article",
    "publishDate": "2026-06-01"
  }
}
```

### API Gateway

Single entry point for the Management Frontend and internal platform API clients.

Responsibilities:

* Routing
* Authentication integration
* Rate limiting
* Request forwarding to internal services

### Identity Service

Handles authentication, authorization, and session management.

Ownership:

* Users
* Roles
* Authentication
* Authorization
* Sessions

Storage:

* Redis for session data

### Content Service

Manages content instances.

Ownership:

* Content drafts
* Master content records
* Content lifecycle state
* File metadata

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

Ownership:

* Content type schemas
* Schema validation rules

Responsibilities:

* Content type definition
* Schema validation
* YAML schema parsing

Storage:

* MongoDB

### Publication Service

Coordinates publication and unpublication requests created from the Management Frontend.

Ownership:

* Publication requests
* Unpublication requests
* Publication state
* Publication events

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

Provides internal read-only content APIs.

Ownership:

* Published read model access
* Internal delivery queries

Responsibilities:

* Published content retrieval
* Internal REST endpoints
* High-performance read operations

Storage:

* Delivery MongoDB database

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
| Authoring structured content | Management MongoDB database |
| Published structured content | Delivery MongoDB database |
| Content type schemas | Management MongoDB database |
| File metadata | Management MongoDB database |
| File metadata | Delivery MongoDB database |
| Binary files | Management Filesystem-backed storage path or mounted volume |
| Binary files | Delivery Filesystem-backed storage path or mounted volume |
| Sessions | Redis |
| Cache | Redis |
| Publication events | RabbitMQ |

Management and Delivery data must not share the same MongoDB collections. The minimum separation is two databases in one MongoDB instance. A stronger deployment may use one MongoDB instance for Management and another MongoDB instance for Delivery.

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
| File storage | Filesystem-backed storage |
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
