# Repository Guidelines

## Project Structure & Module Organization

This repository is currently in Phase 2: project scaffold. The main project overview is in `README.md`; detailed technical decisions live in `docs/architecture.md`; Architecture Decision Records live in `docs/adr/`.

The monorepo structure is:

```text
apps/management-frontend/     Angular Management Frontend
services/*/                   NestJS microservices
packages/shared-*             Shared types, auth, events, and YAML helpers
infrastructure/               Docker, Kubernetes, Helm, and Terraform assets
docs/                         Architecture and ADR documentation
.github/                      CI workflows
```

Keep architecture updates in `docs/architecture.md` and durable decisions in ADR files named `docs/adr/NNNN-short-title.md`.

## Build, Test, and Development Commands

Use these commands from the repository root:

```bash
pnpm install              # Install workspace dependencies
pnpm typecheck            # Build dependencies and run TypeScript checks
pnpm lint                 # Run the current lint gate, backed by TypeScript
pnpm test                 # Run all unit and smoke tests
pnpm build                # Build shared packages, services, and frontend
pnpm dev:frontend         # Start the Angular Management Frontend
docker compose up --build # Start the local stack
```

## Coding Style & Naming Conventions

Use TypeScript for Angular, NestJS, and shared packages. Prefer strict typing, small domain-focused modules, and clean architecture boundaries: `domain`, `application`, `infrastructure`, and `presentation` where useful. Use kebab-case for directories and files, PascalCase for classes/components, camelCase for variables/functions, and UPPER_SNAKE_CASE for constants.

Documentation should be concise, structured with Markdown headings, and written in clear technical English.

## Testing Guidelines

The target testing strategy is documented in `docs/architecture.md`. Minimum goals are 100% coverage for domain unit tests, application use case tests, and API contract tests; 30% for service integration tests; 20% for Angular component/integration tests; and 10% for Playwright E2E workflows. Name tests after the behavior under test, for example `create-folder.use-case.spec.ts`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commits, mainly `docs:` for documentation changes. Use messages such as `docs: define publication workflow details` or `chore: scaffold angular management frontend`.

Pull requests should include a short summary, affected areas, verification performed, and linked issue or roadmap item when available. UI changes should include screenshots once the frontend exists.

## Security & Configuration Tips

Do not commit secrets, tokens, credentials, or production configuration. Keep local examples clearly non-production and document new runtime variables in the relevant README or architecture section.
