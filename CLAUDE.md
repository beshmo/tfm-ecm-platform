# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ECMP (Enterprise Content Management Platform) is a TFM (academic thesis) portfolio project: a cloud-native, microservices-based content management platform. It is currently in **Phase 3 (Core Content Management)** — the monorepo scaffold, shared packages, and CI are in place; business features are being implemented incrementally. See [README.md](README.md), [docs/architecture.md](docs/architecture.md), and [docs/adr/](docs/adr/README.md) for full context and rationale.

## Commands

Run from the repository root (pnpm workspace monorepo):

```bash
pnpm install                 # Install all workspace dependencies
pnpm typecheck               # Build deps (topological) then tsc --noEmit everywhere
pnpm lint                    # Currently backed by tsc --noEmit (no separate linter yet)
pnpm test                    # Run all unit/integration tests across the workspace
pnpm test:frontend           # Run only @ecmp/management-frontend tests
pnpm test:backend            # Run tests for all *-service packages + api-gateway + publication-worker
pnpm build                   # Build shared packages, services, and the frontend
```

Run a single test file or a filtered test within a package (vitest):

```bash
pnpm --filter @ecmp/content-service test -- src/domain/content-validation.spec.ts
pnpm --filter @ecmp/content-service test -- -t "should reject an invalid date"
```

Dev servers (each also runs a `pretest`/`prestart:dev` step that builds `@ecmp/shared-types` first — see "Shared packages" below):

```bash
pnpm dev:frontend                 # Angular dev server on :4200, proxies /api to API Gateway
pnpm dev:api-gateway               # :3000
pnpm dev:identity-service          # :3001
pnpm dev:content-service           # :3002
pnpm dev:publication-service       # :3004
pnpm dev:publication-worker        # :3005
pnpm dev:delivery-service          # :3006
```

Local infrastructure (MongoDB, Redis, RabbitMQ) via Docker Compose:

```bash
docker compose up -d mongodb redis rabbitmq   # infra only, run services with pnpm dev:*
docker compose up --build                     # full stack in containers
```

## Architecture

### Monorepo layout

```
apps/management-frontend/   Angular 20 standalone-component SPA
services/                   NestJS microservices (api-gateway, identity-service,
                             content-service, publication-service,
                             publication-worker, delivery-service)
packages/shared-*           shared-types, shared-events, shared-auth, shared-yaml
infrastructure/              Docker/K8s/Helm assets
docs/                        architecture.md + ADRs (docs/adr/NNNN-*.md)
openspec/                    spec-driven change proposals (see "OpenSpec workflow")
```

### Clean Architecture layering

Both backend services and the frontend's `features/*` folders use the same four layers. Keep the dependency direction one-way: presentation → application → domain, with infrastructure implementing ports used by application/domain.

| Layer | Contains | Must not contain |
| --- | --- | --- |
| `domain` | Entities, value objects, business rules, lifecycle invariants | Framework code, HTTP/DB clients |
| `application` | Use cases (e.g. `create-folder.use-case.ts`) | DOM/HTTP handling, component state |
| `infrastructure` | REST clients/controllers, DTOs, mappers, Mongo/Redis/RabbitMQ adapters | Business rules |
| `presentation` | NestJS controllers / Angular standalone components, forms, view models | Direct backend calls bypassing use cases |

Angular frontend feature areas (`apps/management-frontend/src/app/features/*`): `auth`, `folder-explorer` (composition workspace only — owns no domain rules), `folders`, `content`, `content-types`, `publication`. NgModules are not used; all new components are standalone.

### Service boundaries (each service owns its data; others must go through its API/events)

| Service | Owns |
| --- | --- |
| identity-service | Auth, sessions, users, roles (Redis-backed) |
| content-service | Content drafts/master records, folder hierarchy (including reserved `/system` + `/system/schemas`), lifecycle state, document metadata, content type YAML schemas + validation rules, and folder-contained content type definition objects (MongoDB + filesystem storage) |
| publication-service | Publication/unpublication requests and state (MongoDB + RabbitMQ) |
| publication-worker | Consumes RabbitMQ events, projects/removes content between Management and Delivery MongoDB |
| delivery-service | Read-only published content API (Delivery MongoDB) |
| api-gateway | Single entry point: routing, auth integration, request forwarding |

Content type schemas used to be owned by a standalone `content-type-service`; it was merged into `content-service` because content type definitions are folder-contained objects under `/system/schemas` and folder occupancy/move/delete needed to stay in one consistency boundary (see [ADR-0017](docs/adr/0017-merge-content-type-service-into-content-service.md)).

Management and Delivery data are separate MongoDB databases (`ecmp_management` / `ecmp_delivery`), even when sharing one MongoDB instance — never share collections between them. Publication is projection-based and asynchronous: publication-service emits `content.publish.requested`/`content.unpublish.requested` events over RabbitMQ only after its own DB transaction commits; publication-worker consumes them, writes to Delivery in its own transaction, then emits `content.published`/`content.unpublished`/`*.failed`. No automatic retries — failures are surfaced for manual retry. Worker logic must be idempotent (upsert by `contentId`, keyed by `contentVersion`).

### Shared packages

`packages/shared-types`, `shared-events`, `shared-auth`, `shared-yaml` are real workspace packages consumed via their built `dist/` output (not TS path aliases). Any service/frontend script that imports them runs a `pretest`/`prestart:dev`/build step to compile `@ecmp/shared-types` (and transitively the others) first. If you add a new shared package or a new consumer, wire up the same pre-step rather than relying on tsconfig `references` alone.

### Content model

Content types are YAML schemas (`docs/architecture.md` "Content Model") validated against a small fixed set of field types (`string`, `integer`, `date`, `time`). Folder, Document, and Content type definition are internal platform types that cannot be extended by users; all other content types are user-defined. Global IDs are prefixed (`RCD-`, `FLD-`, `STF-`, `CTD-`), UUIDv4-based, generated server-side; the root folder uses the reserved ID `FLD-root`.

Content type definitions are folder-contained repository objects, not a flat registry: each content type name (e.g. `article`) is one definition object (`CTD-` id) grouping all its schema versions, assigned to a folder under the reserved `/system/schemas` namespace (root `FLD-root` → `/system` (`FLD-system`) → `/system/schemas` (`FLD-system-schemas`)). Those two system folders reject rename/move/delete; normal content records and documents cannot be created under them. Admins can create schema subfolders under `/system/schemas` and move definitions between them; a schema folder can't be deleted while it still contains definitions or child folders. Schema administration (browsing definitions by folder, create/replace/deactivate/move) requires the `content-type:*` permission; listing/reading active schemas by name stays open so authoring flows can pick a content type. See `docs/architecture.md` "Content Type Definitions and the Schema Namespace" for full details.

### Auth model

JWT access tokens (short-lived, `Authorization: Bearer`) + rotated refresh tokens (longer-lived, server-side stored, prefer HttpOnly cookie). RBAC permissions use `resource:action` (e.g. `folder:read`, `<contentTypeName>:*`, `workflow:create`). Missing/invalid auth → `401`; authenticated but unauthorized → `403`. Full role/permission tables are in `docs/architecture.md` "Security Model".

## OpenSpec workflow

This repo uses [OpenSpec](openspec/) for spec-driven feature work: proposals and deltas live under `openspec/changes/<change-id>/`, and merged specs live under `openspec/specs/<capability>/`. Use the `opsx:propose`, `opsx:apply`, `opsx:sync`, `opsx:archive`, and `opsx:explore` skills (or their `.codex`/`.opencode` equivalents) for this flow rather than ad hoc planning docs when the user is working through a change.

## Testing conventions

* TDD for domain rules, application use cases, and validation logic; BDD-style GIVEN-WHEN-THEN test names for user-visible/business behavior.
* Name spec files after the behavior under test, e.g. `create-folder.use-case.spec.ts`.
* Coverage targets (see [AGENTS.md](AGENTS.md)): 100% domain unit + use case + API contract tests; 30% service integration; 20% Angular component/integration; 10% Playwright E2E.
* Vitest is the test runner everywhere (frontend, shared packages, and NestJS services); Jest is not used despite being listed as an optional NestJS default in the README.

## Coding conventions

kebab-case for directories/files, PascalCase for classes/components, camelCase for variables/functions, UPPER_SNAKE_CASE for constants. Apply OWASP Top 10 practices by default on any external input: validate/allowlist, enforce authorization, avoid unsafe deserialization/dynamic execution, limit payload sizes, sanitize error output.

One Angular-specific gotcha already hit once in this codebase: don't expose component state needed by `ngModel`-bound lists as a getter that returns a new array/object each change-detection cycle — Angular will keep rebuilding those form controls and can freeze the UI. Cache the derived value when its source actually changes instead.
