# ADR-0017: Merge Content Type Service Into Content Service

## Status

Accepted

## Context

ADR-0001 established a standalone Content Type Service that owned content type schemas as a flat registry keyed by `name + version`, separate from the Content Service, which owns folders, content records, and documents. Content Service resolved schemas from the Content Type Service over HTTP through `HttpContentTypeSchemaReader`, and the API Gateway routed `/api/management/content-types` to the standalone service.

The platform introduced a requirement to organize content type schemas administratively under a reserved `/system/schemas` folder namespace, making each content type definition a folder-contained repository object with a location, participation in folder occupancy checks, and admin-only browsing. Keeping schema ownership in a separate service would require distributed coordination for folder deletes, moves, and validation — a single repository invariant (can this folder be deleted? is this move within the schema namespace?) would otherwise span two services and two data stores.

## Decision

The Content Type Service is merged into the Content Service. Content Service now owns:

* Content type schema domain, application use cases, and the schema repository (in-memory for this phase, matching existing Content Service persistence).
* Content type definition objects: folder-contained repository objects under `/system/schemas`, keyed by content type name and grouping their schema versions.
* Schema folder administration (create/rename/move/delete schema subfolders) and content type definition moves, both admin-only.

`HttpContentTypeSchemaReader` is replaced by a local, in-process schema repository reader. The API Gateway routes `/api/management/content-types*` to the Content Service. The standalone `content-type-service` package, its Docker Compose service, and its package scripts are removed.

Existing `/api/management/content-types` URLs and response shapes for active-schema listing, latest/explicit version reads, create, replace, and deactivate are preserved so existing callers are unaffected by the routing change.

Alternatives considered:

* Keep Content Type Service separate and add cross-service folder coordination (synchronous calls or eventual consistency) for folder delete/move and schema occupancy checks. Rejected: this turns a single-service invariant into a distributed one for no corresponding benefit at this stage of the project.
* Keep a separate, UI-only schema-folder hierarchy inside Content Type Service instead of a real repository namespace. Rejected: `/system/schemas` is meant to be a real, folder-occupancy-participating namespace, not a parallel tree that only the frontend understands.

## Consequences

Content Service's responsibility surface grows to include schema management, in exchange for removing an entire service boundary and its associated HTTP dependency, runtime wiring, and deployment unit. Folder occupancy, protected-namespace checks, and content type definition moves can now be implemented and tested as ordinary in-process application logic instead of distributed operations.

This is a breaking change for any external caller that addressed the Content Type Service directly rather than through the API Gateway; the Content Type Service is no longer deployed. Docker Compose, package scripts, and backend test filters that referenced `content-type-service` were updated in the same change.

If a future requirement needs schema management to scale or deploy independently from folder/content management again, that would need its own ADR revisiting this decision, since it would reintroduce the distributed-invariant problem this ADR avoids.
