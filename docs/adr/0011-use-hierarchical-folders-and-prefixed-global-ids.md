# ADR-0011: Use Hierarchical Folders And Prefixed Global IDs

## Status

Accepted

## Context

Content instances need to be grouped into hierarchical folders. The platform also needs clear identifiers for folders, content instances, and static files.

## Decision

ECMP will support hierarchical folders as an internal platform type.

Global IDs will use prefixes:

* `FLD-` for folders.
* `RCD-` for content instances.
* `STF-` for static files.

The root folder `/` has the reserved ID `FLD-root`.

## Consequences

Identifiers are easy to inspect and route through APIs. Folder rules must include filesystem-like name validation and unique names within the same parent folder.

