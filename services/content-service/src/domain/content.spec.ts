import type { ContentId, FolderId } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import {
  cloneContentRecord,
  createContentRecord,
  ImmutableContentTypeError,
  patchContentRecord,
  replaceContentRecord
} from "./content";

describe("content domain", () => {
  const now = new Date("2026-06-29T10:00:00.000Z");
  const later = new Date("2026-06-29T11:00:00.000Z");

  it("GIVEN create input WHEN content record is created THEN it initializes as draft version one", () => {
    const content = createContentRecord({
      contentId: "RCD-content1" as ContentId,
      folderId: "FLD-root" as FolderId,
      contentType: "article",
      schemaVersion: "1.0",
      data: { title: "Welcome" },
      now
    });

    expect(content).toMatchObject({
      contentId: "RCD-content1",
      folderId: "FLD-root",
      contentType: "article",
      schemaVersion: "1.0",
      version: 1,
      status: "draft",
      data: { title: "Welcome" }
    });
    expect(content.contentId).toMatch(/^RCD-/);
    expect(content.createdAt).toEqual(now);
    expect(content.updatedAt).toEqual(now);
  });

  it("GIVEN a content record WHEN replaced THEN version and updated timestamp change", () => {
    const content = createContentRecord({
      contentId: "RCD-content1" as ContentId,
      folderId: "FLD-root" as FolderId,
      contentType: "article",
      schemaVersion: "1.0",
      data: { title: "Welcome" },
      now
    });

    const replaced = replaceContentRecord(content, {
      folderId: "FLD-folder1" as FolderId,
      contentType: "article",
      schemaVersion: "2.0",
      data: { title: "Updated" },
      now: later
    });

    expect(replaced).toMatchObject({
      folderId: "FLD-folder1",
      schemaVersion: "2.0",
      version: 2,
      data: { title: "Updated" }
    });
    expect(replaced.createdAt).toEqual(now);
    expect(replaced.updatedAt).toEqual(later);
  });

  it("GIVEN a content record WHEN patched THEN data is shallow merged", () => {
    const content = createContentRecord({
      contentId: "RCD-content1" as ContentId,
      folderId: "FLD-root" as FolderId,
      contentType: "article",
      schemaVersion: "1.0",
      data: { title: "Welcome", priority: 1 },
      now
    });

    const patched = patchContentRecord(content, {
      data: { priority: 2 },
      schemaVersion: "2.0",
      now: later
    });

    expect(patched.data).toEqual({ title: "Welcome", priority: 2 });
    expect(patched.schemaVersion).toBe("2.0");
    expect(patched.version).toBe(2);
    expect(patched.updatedAt).toEqual(later);
  });

  it("GIVEN a different content type WHEN replaced or patched THEN immutable content type error is thrown", () => {
    const content = createContentRecord({
      contentId: "RCD-content1" as ContentId,
      folderId: "FLD-root" as FolderId,
      contentType: "article",
      schemaVersion: "1.0",
      data: { title: "Welcome" },
      now
    });

    expect(() =>
      replaceContentRecord(content, {
        folderId: "FLD-root" as FolderId,
        contentType: "news",
        schemaVersion: "1.0",
        data: { title: "Updated" }
      })
    ).toThrow(ImmutableContentTypeError);
    expect(() => patchContentRecord(content, { contentType: "news" })).toThrow(
      ImmutableContentTypeError
    );
  });

  it("GIVEN content data WHEN records are created and cloned THEN data references are defensive", () => {
    const data = { title: "Welcome", nested: { value: 1 } };
    const content = createContentRecord({
      contentId: "RCD-content1" as ContentId,
      folderId: "FLD-root" as FolderId,
      contentType: "article",
      schemaVersion: "1.0",
      data,
      now
    });

    data.nested.value = 2;
    const clone = cloneContentRecord(content);
    (clone.data["nested"] as { value: number }).value = 3;
    clone.createdAt.setUTCFullYear(2000);

    expect((content.data["nested"] as { value: number }).value).toBe(1);
    expect(content.createdAt).toEqual(now);
  });
});
