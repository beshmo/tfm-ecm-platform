## Context

Phase 3 already includes static file metadata management and a filesystem-backed binary storage adapter. ADR-0010 accepts filesystem-backed storage for the academic phase, with metadata stored separately and Management and Delivery storage separated. The current Content Service implementation uses a `StaticFileStorage` port and writes generated `STF-` based filenames under `STATIC_FILE_STORAGE_ROOT`.

The remaining concern is operational durability. Direct writes to the final path are simple, but they make partial final files possible if the process or filesystem fails during the write. The adapter also needs focused tests with a real temporary directory so path confinement and cleanup behavior are proven outside mocked storage.

## Goals / Non-Goals

**Goals:**

- Preserve the existing static file management API and shared contracts.
- Keep filesystem storage behind the existing `StaticFileStorage` port.
- Store binaries by writing to a temporary file first, then moving the completed file to the generated final path.
- Ensure failed writes do not leave final-path files that metadata can later reference.
- Keep stored paths relative, generated, and confined to the configured storage root.
- Add focused infrastructure tests for filesystem write, delete, cleanup, root confinement, and failure behavior.
- Document local and deployment storage expectations for `STATIC_FILE_STORAGE_ROOT`.

**Non-Goals:**

- MongoDB metadata persistence.
- Object storage, S3, MinIO, or cloud provider APIs.
- Antivirus scanning, MIME content sniffing, deduplication, file versioning, or lifecycle archival.
- Public download, preview, or streaming endpoints.
- Publication projection to Delivery storage.

## Decisions

1. Continue using the `StaticFileStorage` port.

   The application use cases already depend on `StaticFileStorage`, so the hardening should stay inside the filesystem adapter. This keeps domain and application code independent from Node filesystem APIs and leaves a later object storage adapter possible.

   Alternative considered: move write staging into the upload use case. This was rejected because staging is an infrastructure detail and would leak filesystem behavior into application logic.

2. Write to a temporary file before publishing the final path.

   The adapter will create the storage root and a private temporary directory under that root. Saves will write the buffer to a temporary file name derived from the generated static file ID plus a unique suffix, then move it into the final generated storage name. The adapter returns the final relative path only after the move succeeds.

   Alternative considered: keep direct `writeFile` to the final path because uploads are limited to 10 MiB. This is simpler, but it leaves a partially written file at the path that metadata expects if the process is interrupted.

3. Keep generated final filenames flat under the storage root.

   The final storage path remains based on the `STF-` ID plus a safe extension derived from the validated MIME type. The original filename remains metadata only. A flat layout is enough for the Phase 3 size limits and avoids adding directory partitioning rules before they are needed.

   Alternative considered: shard files into prefix directories. This may be useful later for very large file counts, but it complicates migration and tests without a current Phase 3 need.

4. Treat path confinement failures as storage failures.

   Delete operations must resolve stored paths under the configured root and reject traversal outside it. If path resolution, write, move, or delete fails, the adapter should surface an error that the application maps to the normalized static file storage failure category.

   Alternative considered: silently ignore unsafe or missing paths during delete. Missing paths can remain idempotent through force deletion, but unsafe paths must fail loudly because they indicate corrupted metadata or a programming error.

5. Document the in-memory metadata mismatch.

   The scaffold still stores metadata in memory while binaries remain on disk. Documentation should make this development limitation explicit so restarts leaving orphaned local files are understood until the MongoDB persistence slice exists.

## Risks / Trade-offs

- Temporary files can remain after a process crash -> Keep temporary files under a dedicated hidden temp directory and make them safe to delete manually in development.
- Atomic rename semantics vary across filesystems -> Keep temporary and final paths on the same configured root so the move remains a same-volume operation.
- In-memory metadata can be lost while files remain on disk -> Document this as a scaffold limitation and keep metadata persistence as a separate future change.
- Flat file layout may become inefficient with very large file counts -> Accept for Phase 3 and preserve relative-path metadata so a later adapter can introduce partitioning.

## Migration Plan

- Update the filesystem adapter internals without changing the `StaticFileStorage` interface.
- Add infrastructure tests that use a temporary root and clean up after themselves.
- Update architecture or operational documentation for `STATIC_FILE_STORAGE_ROOT`, temporary files, and local restart limitations.
- Existing development files can remain in place because final generated filenames do not change.
- Rollback is limited to reverting the adapter implementation and tests; no API or metadata migration is required.

## Open Questions

- None for this hardening slice.
