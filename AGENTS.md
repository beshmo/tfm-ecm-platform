# Repository Instructions

## Sources Of Truth

- Trust executable config over prose: root `package.json`, `pnpm-workspace.yaml`, package scripts, `tsconfig*.json`, `docker-compose.yml`, and Angular/Vitest config.
- `README.md` still says Phase 2 scaffold, but the code and `openspec/specs/` include Phase 3 content, folder, document, schema, and CMIS work. Verify behavior in code/specs before relying on roadmap text.
- Durable architecture rationale lives in `docs/architecture.md` and ADRs in `docs/adr/NNNN-*.md`. Spec-driven feature artifacts live in `openspec/`.

## Toolchain And Commands

- Required versions are enforced by `package.json`: Node `>=22.12.0 <23`, pnpm `>=11 <12` with `packageManager` pinned to pnpm 11.9.0.
- Install from the repo root with `pnpm install`; the workspace includes `apps/*`, `services/*`, and `packages/*`.
- Main verification commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. `pnpm typecheck` first runs `pnpm -r --sort build`; `pnpm lint` is currently TypeScript `--noEmit`, not ESLint.
- Focus a package with pnpm filters, for example `pnpm --filter @ecmp/content-service test -- src/domain/content.spec.ts`, `pnpm --filter @ecmp/content-service test -- -t "rejects invalid"`, or `pnpm --filter @ecmp/management-frontend typecheck`.
- Shortcut test groups: `pnpm test:frontend` for Angular, `pnpm test:backend` for `@ecmp/*-service`, `@ecmp/api-gateway`, and `@ecmp/publication-worker`.
- Vitest is used across frontend, services, and shared packages. Frontend Vitest uses `jsdom`, `src/test-setup.ts`, and only includes `src/**/*.spec.ts`.

## Testing

- Vitest is the only configured test runner; no repo Playwright config or enforced coverage thresholds are present.
- Prefer focused package tests with `pnpm --filter <package> test -- <file>` before full `pnpm test` when iterating.

## Runtime

- Dev servers: `pnpm dev:frontend` on `:4200`; backend ports are api-gateway `:3000`, identity `:3001`, content `:3002`, content-type `:3003`, publication `:3004`, worker `:3005`, delivery `:3006`.
- Frontend proxy config is `apps/management-frontend/proxy.conf.cjs`; `/api` targets `MANAGEMENT_API_PROXY_TARGET` or defaults to `http://localhost:3000`.
- Local infra only: `docker compose up -d mongodb redis rabbitmq`. Full stack: `docker compose up --build`.
- Docker Compose uses Mongo databases `ecmp_management` and `ecmp_delivery`, Redis, RabbitMQ, and file-storage volumes. Content-service code currently reads `STATIC_FILE_STORAGE_ROOT`; `docker-compose.yml` sets `FILE_STORAGE_PATH`, so verify storage env names before changing file storage behavior.

## Architecture Boundaries

- Backend services are NestJS with entrypoint `services/*/src/main.ts`; modules live under `services/*/src/presentation/app.module.ts`.
- Keep Clean Architecture dependency direction: `presentation` -> `application` -> `domain`; `infrastructure` implements ports/adapters and must not own business rules.
- Service data ownership matters: identity owns auth/users, content-type owns YAML schemas, content owns folders/content/documents/files, publication owns publication requests, worker projects Management to Delivery, delivery is read-only published content, api-gateway is the single management entrypoint.
- Management and Delivery Mongo data must remain separate; publication is asynchronous projection. Worker behavior should be idempotent by `contentId`/`contentVersion`.
- Angular app uses standalone components and routes in `apps/management-frontend/src/app/app.routes.ts`; do not add NgModules.

## Shared Packages

- Shared workspace packages are real packages consumed from built `dist/` output, not TS path aliases: `@ecmp/shared-types`, `@ecmp/shared-events`, `@ecmp/shared-auth`, `@ecmp/shared-yaml`.
- Some consumers have `pretest`/`prestart:dev` scripts that build required shared packages first. If adding a new shared-package consumer, add the same pre-step instead of relying only on TypeScript references.
- `@ecmp/shared-types` defines global ID shapes and constants such as `ROOT_FOLDER_ID = "FLD-root"`; prefer importing constants/types instead of duplicating literals.

## Domain And UI Gotchas

- Content type schemas are strict YAML parsed by `@ecmp/shared-yaml`; supported field types are `string`, `integer`, `date`, `time`, `boolean`, `datetime`, `decimal`, `html`, and `uri`. YAML anchors/aliases and prototype-pollution keys are rejected.
- `CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES` controls content-type schema source size and must be a positive safe integer.
- In Angular templates using `ngModel` inside repeated lists, do not expose the bound collection through a getter that returns a new array/object each change detection cycle; cache derived values when sources change.

## Security And Config

- Do not commit secrets; credentials in `docker-compose.yml` are local development defaults only.
- Validate env names against code and Compose before changing runtime config; file storage currently differs between `STATIC_FILE_STORAGE_ROOT` in code and `FILE_STORAGE_PATH` in Compose.

## OpenSpec Workflow

- For spec-driven changes, use artifacts under `openspec/changes/<change-id>/` and merged specs under `openspec/specs/<capability>/` instead of creating ad hoc planning docs.
- When implementing an OpenSpec change, keep `tasks.md`, delta specs, and code in sync; archive only after implementation and verification are complete.
