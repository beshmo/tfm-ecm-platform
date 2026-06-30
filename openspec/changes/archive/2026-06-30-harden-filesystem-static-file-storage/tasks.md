## 1. Filesystem Storage Tests

- [x] 1.1 Add filesystem storage tests using a real temporary storage root.
- [x] 1.2 Cover successful save behavior, including final relative path, written file contents, and no client path leakage.
- [x] 1.3 Cover delete behavior for stored paths under the storage root.
- [x] 1.4 Cover path traversal rejection for stored paths that resolve outside the storage root.
- [x] 1.5 Cover failed write or publish behavior so unsuccessful saves do not return a final stored path.

## 2. Storage Adapter Hardening

- [x] 2.1 Update `FilesystemStaticFileStorage` to create a private temporary directory under the configured root.
- [x] 2.2 Write uploaded buffers to a temporary file before moving them to the generated final storage name.
- [x] 2.3 Keep final storage names generated from `STF-` IDs plus safe MIME-derived extensions.
- [x] 2.4 Ensure temporary and final paths are resolved under the same configured storage root.
- [x] 2.5 Ensure filesystem write, move, path resolution, and delete failures surface through the existing storage failure mapping.

## 3. Documentation

- [x] 3.1 Document `STATIC_FILE_STORAGE_ROOT`, the local development default, and the temporary-file staging behavior.
- [x] 3.2 Document that Phase 3 in-memory metadata can leave orphaned local binaries after service restarts until metadata persistence is added.
- [x] 3.3 Confirm Management and Delivery filesystem storage remain documented as separate future deployment volumes.

## 4. Verification

- [x] 4.1 Run backend tests covering the Content Service static file storage and upload flows.
- [x] 4.2 Run the workspace lint gate.
- [x] 4.3 Run OpenSpec validation for `harden-filesystem-static-file-storage`.
