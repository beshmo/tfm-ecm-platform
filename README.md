# TFM - Enterprise Content Management Platform (ECMP)

ECMP is a cloud-native Enterprise Content Management Platform designed as the final project for a TFM academic work. The repository contains the initial runnable monorepo scaffold and the architecture/specification documentation.

The goal is to build a portfolio-ready system that demonstrates enterprise architecture, microservices, frontend-driven content management, asynchronous publication workflows, containerized deployment, and Kubernetes-oriented operations.

## Current Status

The project is in Phase 2: project scaffold.

At this stage, the repository contains the Angular Management Frontend shell, NestJS service shells, shared packages, Docker Compose support, and basic CI checks. Business features are not implemented yet.

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
* Provide standards-based CMIS compatibility for enterprise content clients.
* Follow cloud-native and Twelve-Factor application principles.
* Provide a clear academic and professional portfolio case study.

## Documentation

Detailed technical documentation lives in the `docs` directory:

* [Architecture](docs/architecture.md)
* [Architecture Decision Records](docs/adr/README.md)
* [Security Reports](docs/security/README.md)

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
| Compatibility API | CMIS 1.1 Browser Binding, planned |
| Schema definition | YAML |
| Content definition | YAML |

REST will be the initial and primary API style. CMIS 1.1 Browser Binding support is planned as a standards-based compatibility layer over the Management Stage, not as a replacement for ECMP's native REST APIs. It maps folders to `cmis:folder`, static files to `cmis:document`, and structured content records to `cmis:item` descendants, exposing each object-type definition with the CMIS 1.1 common object-type attributes. GraphQL may be considered later as a future enhancement.

## Required Applications and Tools

The following tools are needed to implement and run the Phase 2 project scaffold.

### Required Local Tools

| Tool | Purpose |
| --- | --- |
| Git | Version control and commit workflow. |
| Node.js LTS | Runtime for Angular, NestJS, TypeScript tooling, tests, and package scripts. |
| Corepack | Enables package managers such as `pnpm` from the Node.js installation. |
| pnpm | Recommended monorepo package manager. |
| Docker Desktop | Runs local containers for infrastructure dependencies and service images. |
| Docker Compose v2 | Starts the local development stack with `docker compose up`. |
| VS Code or another IDE | Code editing, TypeScript support, debugging, and Git integration. |
| Modern browser | Runs and verifies the Angular Management Frontend. |

### Project CLIs

Project scaffolding can use local repository dependencies or one-off commands through `pnpm dlx`.

| Tool | Purpose |
| --- | --- |
| Angular CLI | Scaffolds and manages the Angular Management Frontend. |
| NestJS CLI | Scaffolds backend services. |
| TypeScript | Provides compile and typecheck support across apps, services, and packages. |

Example commands:

```bash
pnpm dlx @angular/cli new management-frontend
pnpm dlx @nestjs/cli new api-gateway
```

### Testing Tools

These tools should be installed as repository dependencies during Phase 2 instead of global applications.

| Tool | Purpose |
| --- | --- |
| Vitest | Unit tests for frontend, shared packages, and optionally backend code. |
| Angular testing utilities | Angular component and integration tests. |
| Playwright | End-to-end browser workflows. |
| Jest | Optional alternative for NestJS tests if the scaffold keeps NestJS defaults. |

### Optional Tools

| Tool | Purpose |
| --- | --- |
| GitHub CLI | Pull request and CI workflow inspection. |
| MongoDB Compass | Visual inspection of MongoDB data during later implementation phases. |
| Postman or Insomnia | Manual REST API testing. |
| kubectl, Helm, kind, or minikube | Kubernetes development and validation in later phases. |

MongoDB, Redis, and RabbitMQ do not need to be installed directly on the host machine for local development. They should run through Docker Compose.

## Implementation Guidelines

Implementation work should follow the engineering standards defined in [Architecture](docs/architecture.md):

* Use Clean Architecture boundaries: `domain`, `application`, `infrastructure`, and `presentation`.
* Practice TDD for domain rules, application use cases, validation logic, and API contracts.
* Use BDD-style test names with GIVEN-WHEN-THEN wording for behavior-focused tests.
* Apply OWASP Top 10 practices when handling external input, authentication, authorization, errors, dependencies, and sensitive data.

## Repository Structure

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
|   `-- docker/
|
|-- docs/
`-- .github/
```

## Roadmap

### Phase 1 - Specification

* Define the architecture.
* Define the initial content model.
* Define service responsibilities.
* Define initial REST API contracts.
* Define the frontend architecture.
* Define the publication workflow.
* Decide the final Management and Delivery storage separation.
* Define the security model.
* Define the deployment architecture.
* Define the testing architecture.
* Define observability standards.
* Record important architecture decisions as ADRs.

### Phase 2 - Project Scaffold

* Create the monorepo structure. Done.
* Scaffold the Angular Management Frontend. Done.
* Configure TypeScript and NestJS. Done.
* Add shared packages. Done.
* Add Docker Compose support for local development. Done.
* Add basic CI checks. Done.
* Add the initial frontend unit test setup. Done.

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
* Add initial CMIS Browser Binding compatibility for the Management Stage.
* Add Kubernetes manifests or Helm charts.
* Add Management and Delivery persistent file storage volumes.
* Add observability basics.
* Document local and Kubernetes deployment.

## Quick Start

Install dependencies from the repository root:

```bash
pnpm install
```

Run validation checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:frontend
pnpm build
```

Runtime configuration:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES` | `65536` | Maximum author-facing YAML schema source size accepted by the Content Type Service for schema create and replace requests. |

Run the Angular Management Frontend:

```bash
pnpm dev:frontend
```

The frontend dev server proxies `/api` requests to the API Gateway. Local shell runs default to `http://localhost:3000`; Docker Compose sets `MANAGEMENT_API_PROXY_TARGET=http://api-gateway:3000` for container-to-container routing. Start the API Gateway and the target backend services before testing API-backed screens.

Run an individual backend service:

```bash
pnpm dev:api-gateway
```

Start the local infrastructure dependencies:

```bash
docker compose up -d mongodb redis rabbitmq
```

Start the full local Compose stack:

```bash
docker compose up --build
```

## License

This project is released under the Apache License 2.0. See [LICENSE](LICENSE) for details.
