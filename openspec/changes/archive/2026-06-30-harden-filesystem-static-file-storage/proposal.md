## Why

Filesystem-backed static file storage is already the accepted Phase 3 direction, but the first slice writes binaries directly to their final path and keeps several operational guarantees implicit. Before treating file uploads as core content-management infrastructure, the storage behavior should be made more durable, testable, and explicit.

This change hardens the existing filesystem adapter without changing the management API shape or introducing object storage.

## What Changes

- Write uploaded binaries through a temporary file and atomic move into the final generated storage path.
- Keep generated internal storage paths based on `STF-` IDs and continue rejecting client-supplied path semantics.
- Ensure filesystem storage failures are consistently mapped to static file storage errors.
- Add real filesystem adapter tests that cover successful writes, cleanup, safe path resolution, and failed writes.
- Document the operational behavior for `STATIC_FILE_STORAGE_ROOT`, local development storage, and future management/delivery volume separation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `static-file-management`: Clarify and strengthen the binary storage guarantees for filesystem-backed static file uploads and deletion.

## Impact

- Affects the Content Service filesystem static file storage adapter.
- Affects static file use-case and infrastructure test coverage.
- Affects architecture or operational documentation for local filesystem storage behavior.
- Does not change existing REST endpoints, shared contracts, allowed MIME types, file size limits, or frontend API usage.
