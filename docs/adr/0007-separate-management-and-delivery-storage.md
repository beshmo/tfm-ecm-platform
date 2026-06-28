# ADR-0007: Separate Management And Delivery Storage

## Status

Accepted

## Context

ECMP separates authoring concerns from delivery concerns. Management data includes drafts, workflow state, permissions, and authoring metadata. Delivery data should be optimized for internal read-only access.

## Decision

Management and Delivery storage will be separated at the MongoDB database level.

Both databases may run on the same MongoDB instance for local or simple environments. Separate MongoDB instances are valid for stronger operational isolation.

## Consequences

Delivery can evolve independently from Management and avoid exposing authoring-only data. Publication must explicitly project data between stages.

