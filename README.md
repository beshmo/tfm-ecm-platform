# TFM - Enterprise Content Management Platform (ECMP)

The Enterprise Content Management Platform (ECMP) is an open-source, cloud-native, enterprise content management platform built on Kubernetes, Linux containers, and Twelve-Factor principles, released under the Apache License 2.0 to encourage community adoption, commercial usage, and ecosystem growth.

## 1. Overview

The platform is designed around stateless application services running in containers, enabling elastic scaling and high availability in Kubernetes-based environments.

Content models and content instances are defined using YAML, allowing schema-driven development and a high degree of flexibility without requiring code changes for most content structure modifications.

The platform follows a staged content lifecycle with separate Management and Delivery environments and asynchronous publication workflows.

ECMP is an open-source, cloud-native enterprise content management platform built on Kubernetes, Linux containers, and Twelve-Factor principles, released under the Apache License 2.0 to encourage community adoption, commercial usage, and ecosystem growth.

---

# 2. Objectives

The primary objectives of the platform are:

* Provide enterprise-grade content management capabilities.
* Support horizontal scaling through stateless application services.
* Use schema-driven content definitions.
* Enable asynchronous publishing and unpublishing operations.
* Support cloud-native deployment patterns.
* Facilitate AI-assisted development through Specification-Driven Development (SDD).
* Maintain a clear separation between content authoring and content delivery.

---

# 3. High-Level Architecture

```text
+--------------------------------------------------+
|                Management Stage                  |
+--------------------------------------------------+

        +-----------------------+
        | Management API        |
        +-----------+-----------+
                    |
                    v

              MongoDB
         (Authoring Content)

                    |
                    |
             Publish Request
                    |
                    v

               RabbitMQ

                    |
                    v

+--------------------------------------------------+
|                 Delivery Stage                   |
+--------------------------------------------------+

       +------------------------+
       | Publication Worker     |
       +------------+-----------+
                    |
                    v

              MongoDB
        (Published Content)

                    |
                    v

           Delivery API

```

---

# 4. Core Architectural Principles

## 4.1 Stateless Services

All application services must be stateless.

No session information shall be stored locally in application containers.

This enables:

* Horizontal scaling
* Rolling deployments
* Self-healing infrastructure
* Container replacement without data loss

## 4.2 Externalized State

All stateful information must be stored in dedicated infrastructure services:

| Component          | Storage                 |
| ------------------ | ----------------------- |
| Content            | MongoDB                 |
| Sessions           | Redis                   |
| Cache              | Redis                   |
| Publication Events | RabbitMQ                |
| Files              | Object Storage (future) |

---

# 5. Content Model

The platform uses a schema-driven content architecture.

## 5.1 Content Type Definitions

Content types are defined as YAML schemas.

Example:

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

These schemas define:

* Allowed fields
* Data types
* Validation rules
* Mandatory fields
* Future extensibility

---

# 6. Initial Content Types

The first platform version will support two content types.

## 6.1 Generic Content

Represents structured editorial content.

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

---

## 6.2 File Content

Represents binary assets.

Example use cases:

* PDFs
* Images
* Documents
* Videos

Example:

```yaml
id: file-001

type: file

filename: manual.pdf

mimeType: application/pdf

size: 124500
```

---

# 7. Content Instances

Content instances are stored internally as documents in MongoDB.

The authoritative representation remains YAML.

Typical lifecycle:

1. YAML definition created.
2. Validation against schema.
3. Conversion to internal document model.
4. Persistence in MongoDB.
5. Publication workflow execution.

---

# 8. Content Lifecycle

## Draft

Content is being edited.

## Approved

Content is ready for publication.

## Published

Content is available in the Delivery Stage.

## Unpublished

Content has been removed from the Delivery Stage.

## Archived

Content remains stored but is no longer active.

---

# 9. Environment Separation

## Management Stage

Purpose:

* Content authoring
* Editing
* Validation
* Approval workflows
* Publication requests

Characteristics:

* Accessible only to authenticated users
* Full CRUD capabilities
* Stores master content

---

## Delivery Stage

Purpose:

* Public content delivery
* Read-only access
* High performance content retrieval

Characteristics:

* Optimized for read operations
* Contains only published content
* Isolated from authoring activities

---

# 10. Publication Workflow

Publication must be asynchronous.

## Publishing Process

1. Author requests publication.
2. Content status changes to "Publishing".
3. Publication event is sent to RabbitMQ.
4. Publication Worker receives the event.
5. Content is copied to the Delivery Stage.
6. Status changes to "Published".

---

## Unpublishing Process

1. Author requests unpublication.
2. Event is sent to RabbitMQ.
3. Publication Worker removes the content from the Delivery Stage.
4. Status changes to "Unpublished".

---

# 11. Messaging Architecture

RabbitMQ acts as the event backbone.

Example events:

```text
content.publish.requested
content.published
content.unpublish.requested
content.unpublished
```

Benefits:

* Loose coupling
* Resilience
* Scalability
* Event-driven architecture

---

# 12. MongoDB Data Model

## Content Collection

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

---

## Content Type Collection

```json
{
  "_id": "...",
  "name": "generic",
  "version": "1.0",
  "schema": {}
}
```

---

# 13. Redis Usage

Redis will be used for:

## Session Storage

User authentication sessions.

## Distributed Cache

Frequently requested content.

## Distributed Locks

Future support for concurrency control.

## Rate Limiting

API protection mechanisms.

---

# 14. Planned Microservices

## API Gateway

Single entry point.

Responsibilities:

* Routing
* Authentication
* Rate limiting

---

## Identity Service

Responsibilities:

* Authentication
* Authorization
* Session management

Storage:

* Redis

---

## Content Service

Responsibilities:

* Content CRUD
* Validation
* Versioning

Storage:

* MongoDB

---

## Content Type Service

Responsibilities:

* Schema management
* Schema validation

Storage:

* MongoDB

---

## Publication Service

Responsibilities:

* Publication requests
* Event generation

Dependencies:

* RabbitMQ

---

## Publication Worker

Responsibilities:

* Event consumption
* Synchronization between stages

Dependencies:

* RabbitMQ
* MongoDB

---

## Delivery Service

Responsibilities:

* Public content APIs
* Read-only content access

Storage:

* Delivery MongoDB

---

# 15. Technology Stack

| Layer              | Technology |
| ------------------ | ---------- |
| Language           | TypeScript |
| Runtime            | Node.js    |
| Framework          | NestJS     |
| Database           | MongoDB    |
| Cache              | Redis      |
| Messaging          | RabbitMQ   |
| Containerization   | Docker     |
| Orchestration      | Kubernetes |
| API                | REST       |
| Schema Definition  | YAML       |
| Content Definition | YAML       |

---

# 16. Future Enhancements

## Content Versioning

Full revision history.

## Workflow Engine

Approval workflows.

## Search Engine

OpenSearch integration.

## Asset Management

Object storage integration.

## GraphQL API

Alternative API layer.

## Multi-site Support

Single platform serving multiple sites.

## AI Capabilities

* Content generation assistance
* Metadata enrichment
* Automatic tagging
* Semantic search
* Content recommendations

---

# 17. Non-Functional Requirements

## Scalability

Horizontal scaling of all application services.

## Availability

No single point of failure.

## Performance

Low-latency content delivery.

## Security

Role-based access control.

## Observability

Centralized logging, metrics and tracing.

## Cloud Native

Designed for Kubernetes deployment.

## Extensibility

New content types can be introduced without application code changes.

---

# 18. Cloud-Native Architecture

## 18.1 Container-First Design

The platform is designed from the ground up to run inside Linux containers.

Every application component must be deployable as an independent container image and must not rely on host-specific configurations.

Objectives:

* Immutable deployments
* Reproducible environments
* Horizontal scalability
* Infrastructure portability
* Simplified operations

All runtime environments shall be based on OCI-compliant Linux containers.

Examples:

* Docker
* Podman
* containerd

The platform must be deployable on:

* Kubernetes
* OpenShift
* Docker Swarm (optional)
* Local container environments for development

---

## 18.2 Containerization Strategy

Each microservice is packaged as a separate container image.

Example:

```text
content-service
publication-service
delivery-service
identity-service
publication-worker
api-gateway
```

Container images should:

* Be immutable
* Be versioned
* Follow semantic versioning
* Be built through CI/CD pipelines

---

## 18.3 Minimal Runtime Images

Production images should use lightweight Linux base images.

Examples:

```text
Alpine Linux
Distroless
Wolfi
```

Requirements:

* Minimal attack surface
* Reduced image size
* Faster startup times
* Improved security posture

---

## 18.4 Stateless Containers

Application containers must never store persistent state locally.

The container filesystem shall be considered ephemeral.

If a container is destroyed:

* No content is lost
* No session is lost
* No publication event is lost

All state is externalized to dedicated infrastructure services.

---

# 19. Twelve-Factor Application Compliance

The platform shall follow the Twelve-Factor App methodology.

---

## Factor I - Codebase

A single version-controlled codebase tracked in Git.

Example:

```text
github.com/company/ecmp
```

---

## Factor II - Dependencies

All dependencies explicitly declared.

Example:

```json
{
  "dependencies": {
    "@nestjs/core": "...",
    "mongodb": "...",
    "ioredis": "..."
  }
}
```

No dependency may rely on software pre-installed on the host.

---

## Factor III - Configuration

Configuration stored in environment variables.

Examples:

```text
MONGODB_URI
REDIS_URI
RABBITMQ_URI
JWT_SECRET
```

Configuration files must never contain environment-specific values.

---

## Factor IV - Backing Services

External services treated as attached resources.

Examples:

```text
MongoDB
Redis
RabbitMQ
Object Storage
OpenSearch
```

Services can be replaced through configuration only.

---

## Factor V - Build, Release, Run

Strict separation between:

* Build
* Release
* Run

Pipeline example:

```text
Source Code
    ↓
Build Image
    ↓
Release Version
    ↓
Deploy
```

---

## Factor VI - Processes

Application services run as stateless processes.

No local persistence.

No shared memory between replicas.

---

## Factor VII - Port Binding

Services expose functionality through network ports.

Example:

```text
Content Service -> :3000
Delivery Service -> :3001
Gateway -> :8080
```

---

## Factor VIII - Concurrency

Scaling is achieved by adding process replicas.

Example:

```text
1 Content Service Pod
        ↓
10 Content Service Pods
```

No application code changes required.

---

## Factor IX - Disposability

Containers must start and stop quickly.

Requirements:

* Fast startup
* Graceful shutdown
* Message acknowledgment handling
* Connection draining

Particularly important for Kubernetes rolling updates.

---

## Factor X - Dev/Prod Parity

Development and production environments should remain as similar as possible.

The same Linux container image should run in:

* Developer workstation
* Test environment
* Production environment

---

## Factor XI - Logs

Applications must write logs to stdout/stderr.

Containers must not manage log files.

Log aggregation handled externally.

Examples:

```text
Fluent Bit
Loki
Elastic Stack
OpenSearch
```

---

## Factor XII - Admin Processes

Administrative tasks run as one-off processes.

Examples:

```text
schema migration
content import
data repair
bulk publication
```

These processes use the same codebase and container image.

---

# 20. Kubernetes Deployment Model

The reference deployment platform is Kubernetes.

---

## Workloads

Deployment resources:

```text
api-gateway
content-service
content-type-service
publication-service
delivery-service
identity-service
```

Worker resources:

```text
publication-worker
```

---

## Horizontal Pod Autoscaling

Services should support automatic scaling.

Metrics:

* CPU
* Memory
* Request rate
* Queue depth

Example:

```text
minReplicas: 2
maxReplicas: 20
```

---

## High Availability

No service should depend on a single running instance.

All application services must support multiple replicas.

Example:

```text
3 API Gateway Pods
3 Content Service Pods
3 Delivery Service Pods
```

---

# 21. Observability

Observability is a first-class architectural concern.

---

## Metrics

Collected through OpenTelemetry.

Examples:

* Request count
* Response time
* Publication latency
* Queue depth

---

## Distributed Tracing

All requests must propagate trace identifiers.

Example flow:

```text
Gateway
   ↓
Content Service
   ↓
Publication Service
   ↓
RabbitMQ
   ↓
Publication Worker
```

---

## Centralized Logging

All logs aggregated from Linux containers.

Requirements:

* Structured JSON logs
* Correlation IDs
* Trace IDs

---

# 22. Architectural Differentiators

The platform differs from traditional enterprise CMS solutions through:

* Stateless architecture
* Linux container-first deployment model
* Twelve-Factor compliance
* Horizontal scalability
* Event-driven publication
* Schema-driven content modelling
* YAML-based content definitions
* Cloud-native operations
* Kubernetes-native deployment
* Infrastructure as Code compatibility
* AI-assisted development through SDD
