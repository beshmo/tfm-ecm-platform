import type { ContentId, ContentInstanceData, FolderId } from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import { createContentRecord } from "../domain/content";
import { CryptoContentIdGenerator, InMemoryContentRepository } from "./in-memory-content.repository";

describe("in-memory content repository", () => {
  const now = new Date("2026-06-29T10:00:00.000Z");
  const later = new Date("2026-06-29T11:00:00.000Z");

  it("GIVEN records exist WHEN listed THEN records are sorted by createdAt then contentId", async () => {
    const repository = new InMemoryContentRepository([
      content("RCD-b" as ContentId, ROOT_FOLDER_ID, now),
      content("RCD-c" as ContentId, ROOT_FOLDER_ID, later),
      content("RCD-a" as ContentId, ROOT_FOLDER_ID, now)
    ]);

    const records = await repository.list();

    expect(records.map((record) => record.contentId)).toEqual(["RCD-a", "RCD-b", "RCD-c"]);
  });

  it("GIVEN records exist WHEN listed by folder THEN only matching records are returned", async () => {
    const folderId = "FLD-folder1" as FolderId;
    const repository = new InMemoryContentRepository([
      content("RCD-a" as ContentId, ROOT_FOLDER_ID, now),
      content("RCD-b" as ContentId, folderId, now)
    ]);

    const records = await repository.listByFolderId(folderId);

    expect(records.map((record) => record.contentId)).toEqual(["RCD-b"]);
  });

  it("GIVEN a saved record WHEN retrieved and mutated THEN stored data is not mutated", async () => {
    const repository = new InMemoryContentRepository();
    const saved = await repository.save(
      content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now, { nested: { value: 1 } })
    );

    (saved.data["nested"] as { value: number }).value = 2;
    saved.createdAt.setUTCFullYear(2000);

    const stored = await repository.findById("RCD-content1" as ContentId);

    expect((stored?.data["nested"] as { value: number }).value).toBe(1);
    expect(stored?.createdAt).toEqual(now);
  });

  it("GIVEN a record exists WHEN replaced THEN updated record is stored", async () => {
    const repository = new InMemoryContentRepository([
      content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now)
    ]);
    const replacement = content("RCD-content1" as ContentId, ROOT_FOLDER_ID, later, {
      title: "Updated"
    });

    await repository.replace(replacement);

    await expect(repository.findById("RCD-content1" as ContentId)).resolves.toMatchObject({
      data: { title: "Updated" }
    });
  });

  it("GIVEN a record exists WHEN deleted THEN it can no longer be retrieved", async () => {
    const repository = new InMemoryContentRepository([
      content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now)
    ]);

    await repository.delete("RCD-content1" as ContentId);

    await expect(repository.findById("RCD-content1" as ContentId)).resolves.toBeNull();
  });

  it("GIVEN records are assigned to folders WHEN occupancy is checked THEN assigned content is reported", async () => {
    const repository = new InMemoryContentRepository([
      content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now)
    ]);

    await expect(repository.hasAssignedContent(ROOT_FOLDER_ID)).resolves.toBe(true);
    await expect(repository.hasAssignedContent("FLD-empty" as FolderId)).resolves.toBe(false);
  });
});

describe("content infrastructure helpers", () => {
  it("GIVEN crypto content ID generation WHEN next is called THEN an RCD id is returned", () => {
    const generator = new CryptoContentIdGenerator();

    expect(generator.next()).toMatch(/^RCD-/);
  });
});

function content(
  contentId: ContentId,
  folderId: FolderId,
  now: Date,
  data: ContentInstanceData = { title: "Welcome" }
) {
  return createContentRecord({
    contentId,
    folderId,
    contentType: "article",
    schemaVersion: "1.0",
    data,
    now
  });
}
