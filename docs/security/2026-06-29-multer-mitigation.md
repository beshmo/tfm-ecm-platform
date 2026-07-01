# Security Report: Multer Vulnerability Mitigation

Date: 2026-06-29
Status: Mitigated

## Summary

Docker Scout reported two vulnerabilities in `multer@2.1.1` in the API Gateway image:

| CVE | Severity | Reported fixed version |
| --- | --- | --- |
| `CVE-2026-5079` | High | `2.2.0` |
| `CVE-2026-5038` | Medium | `2.2.0` |

The vulnerable package was not imported directly by ECMP code. It was present as a transitive dependency of `@nestjs/platform-express@11.1.27`, which is used by the NestJS backend services.

## Dependency Usage

Confirmed API Gateway dependency path:

```text
@ecmp/api-gateway
`-- @nestjs/platform-express@11.1.27
    `-- multer@2.1.1
```

Workspace-wide, `multer` was included by all backend services that depend on `@nestjs/platform-express`:

* `@ecmp/api-gateway`
* `@ecmp/identity-service`
* `@ecmp/content-service`
* `@ecmp/content-type-service`
* `@ecmp/publication-service`
* `@ecmp/publication-worker`
* `@ecmp/delivery-service`

At the time of mitigation, the codebase had no direct `multer` imports, no multipart upload decorators, and no implemented file-upload endpoints. The exposure was therefore package/image presence rather than an active upload workflow.

## Implemented Mitigation

The workspace now forces `multer@2.2.0` through the pnpm workspace override:

```yaml
overrides:
  multer: 2.2.0
```

Implementation files:

* `pnpm-workspace.yaml`
* `pnpm-lock.yaml`

`pnpm` v11 ignores `package.json` `pnpm.overrides`, so the override is intentionally defined in `pnpm-workspace.yaml`.

## Verification

The dependency tree now resolves only `multer@2.2.0`:

```bash
pnpm why multer -r
```

The local API Gateway image was rebuilt and checked:

```bash
docker compose build api-gateway
docker run --rm tfm-ecm-platform-api-gateway:latest pnpm why multer --filter @ecmp/api-gateway
docker scout cves --only-package multer local://tfm-ecm-platform-api-gateway:latest
```

Docker Scout result for the rebuilt API Gateway image:

```text
No vulnerable packages detected
```

All backend Docker images were rebuilt because the same transitive dependency is present in every NestJS service image.

Project validation passed:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
git diff --check
```

## Follow-Up Hardening

When document upload endpoints are implemented:

* Configure Multer limits explicitly, including `fieldNestingDepth`, `fields`, `files`, and `fileSize`.
* Require authentication and authorization for upload routes.
* Validate document metadata and content type before accepting uploads.
* Add dependency and image vulnerability scanning to CI.

References:

* [Multer v2.2.0 release](https://github.com/expressjs/multer/releases/tag/v2.2.0)
* [GHSA-3p4h-7m6x-2hcm / CVE-2026-5038](https://github.com/expressjs/multer/security/advisories/GHSA-3p4h-7m6x-2hcm)
* [GHSA-72gw-mp4g-v24j / CVE-2026-5079](https://github.com/expressjs/multer/security/advisories/GHSA-72gw-mp4g-v24j)
