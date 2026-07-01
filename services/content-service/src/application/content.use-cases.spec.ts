import type {
  ContentId,
  ContentInstanceData,
  ContentTypeSchemaDefinition,
  FolderId
} from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import type { ContentIdGenerator } from "../domain/content-id-generator";
import { createContentRecord, ImmutableContentTypeError } from "../domain/content";
import { createFolderRecord, createRootFolder } from "../domain/folder";
import { InMemoryContentRepository } from "../infrastructure/in-memory-content.repository";
import { InMemoryContentTypeSchemaReader } from "../infrastructure/in-memory-content-type-schema.reader";
import { InMemoryFolderRepository } from "../infrastructure/in-memory-folder.repository";
import { ContentTypeSchemaNotFoundError } from "./content-validation.errors";
import {
  ContentFolderNotFoundError,
  ContentNotFoundError,
  InvalidContentDataError
} from "./content.errors";
import {
  CreateContentUseCase,
  DeleteContentUseCase,
  GetContentUseCase,
  ListContentsUseCase,
  PatchContentUseCase,
  ReplaceContentUseCase
} from "./content.use-cases";

describe("content use cases", () => {
  const now = new Date("2026-06-29T10:00:00.000Z");
  const later = new Date("2026-06-29T11:00:00.000Z");

  it("GIVEN content exists WHEN listed THEN all or folder-filtered records are returned", async () => {
    const folderId = "FLD-folder1" as FolderId;
    const repository = new InMemoryContentRepository([
      content("RCD-2" as ContentId, ROOT_FOLDER_ID, now),
      content("RCD-1" as ContentId, folderId, now)
    ]);

    const all = await new ListContentsUseCase(repository).execute();
    const filtered = await new ListContentsUseCase(repository).execute(folderId);

    expect(all.map((record) => record.contentId)).toEqual(["RCD-1", "RCD-2"]);
    expect(filtered.map((record) => record.folderId)).toEqual([folderId]);
  });

  it("GIVEN content exists WHEN retrieved THEN it is returned", async () => {
    const repository = new InMemoryContentRepository([
      content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now)
    ]);

    const record = await new GetContentUseCase(repository).execute("RCD-content1" as ContentId);

    expect(record.contentId).toBe("RCD-content1");
  });

  it("GIVEN content is missing WHEN retrieved THEN content not found is thrown", async () => {
    await expect(
      new GetContentUseCase(new InMemoryContentRepository()).execute("RCD-missing" as ContentId)
    ).rejects.toBeInstanceOf(ContentNotFoundError);
  });

  it("GIVEN valid data without schema version WHEN created THEN latest schema version is persisted", async () => {
    const useCase = newCreateUseCase({ now });

    const record = await useCase.execute({
      folderId: ROOT_FOLDER_ID,
      contentType: "article",
      data: { title: "Welcome", priority: 1 }
    });

    expect(record).toMatchObject({
      contentId: "RCD-generated",
      folderId: ROOT_FOLDER_ID,
      contentType: "article",
      schemaVersion: "2.0",
      version: 1,
      status: "draft"
    });
  });

  it("GIVEN explicit schema version WHEN created THEN requested schema version is persisted", async () => {
    const useCase = newCreateUseCase({ now });

    const record = await useCase.execute({
      folderId: ROOT_FOLDER_ID,
      contentType: "article",
      schemaVersion: "1.0",
      data: { title: "Welcome" }
    });

    expect(record.schemaVersion).toBe("1.0");
  });

  it("GIVEN missing folder WHEN created THEN folder not found is thrown", async () => {
    const useCase = newCreateUseCase({ now });

    await expect(
      useCase.execute({
        folderId: "FLD-missing" as FolderId,
        contentType: "article",
        data: { title: "Welcome" }
      })
    ).rejects.toBeInstanceOf(ContentFolderNotFoundError);
  });

  it("GIVEN missing schema WHEN created THEN schema not found is thrown", async () => {
    const useCase = newCreateUseCase({ now });

    await expect(
      useCase.execute({
        folderId: ROOT_FOLDER_ID,
        contentType: "missing",
        data: { title: "Welcome" }
      })
    ).rejects.toBeInstanceOf(ContentTypeSchemaNotFoundError);
  });

  it("GIVEN invalid data WHEN created THEN invalid content data is thrown", async () => {
    const useCase = newCreateUseCase({ now });

    await expect(
      useCase.execute({
        folderId: ROOT_FOLDER_ID,
        contentType: "article",
        schemaVersion: "1.0",
        data: { title: 1 }
      })
    ).rejects.toBeInstanceOf(InvalidContentDataError);
  });

  it("GIVEN content exists WHEN replaced THEN stored schema can be reused and version increments", async () => {
    const { repository, folderRepository, schemaReader } = fixtures();
    await repository.save(content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now));

    const record = await new ReplaceContentUseCase(
      repository,
      folderRepository,
      schemaReader,
      () => later
    ).execute("RCD-content1" as ContentId, {
      folderId: ROOT_FOLDER_ID,
      contentType: "article",
      data: { title: "Updated" }
    });

    expect(record).toMatchObject({ version: 2, schemaVersion: "1.0", data: { title: "Updated" } });
    expect(record.updatedAt).toEqual(later);
  });

  it("GIVEN content exists WHEN replaced with explicit schema THEN schema version is updated", async () => {
    const { repository, folderRepository, schemaReader } = fixtures();
    await repository.save(content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now));

    const record = await new ReplaceContentUseCase(repository, folderRepository, schemaReader).execute(
      "RCD-content1" as ContentId,
      {
        folderId: ROOT_FOLDER_ID,
        schemaVersion: "2.0",
        data: { title: "Updated", priority: 2 }
      }
    );

    expect(record.schemaVersion).toBe("2.0");
  });

  it("GIVEN missing content WHEN replaced THEN content not found is thrown", async () => {
    const { repository, folderRepository, schemaReader } = fixtures();

    await expect(
      new ReplaceContentUseCase(repository, folderRepository, schemaReader).execute(
        "RCD-missing" as ContentId,
        { folderId: ROOT_FOLDER_ID, data: { title: "Updated" } }
      )
    ).rejects.toBeInstanceOf(ContentNotFoundError);
  });

  it("GIVEN invalid replace dependencies WHEN replaced THEN expected errors are thrown", async () => {
    const { repository, folderRepository, schemaReader } = fixtures();
    await repository.save(content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now));

    const useCase = new ReplaceContentUseCase(repository, folderRepository, schemaReader);

    await expect(
      useCase.execute("RCD-content1" as ContentId, {
        folderId: "FLD-missing" as FolderId,
        data: { title: "Updated" }
      })
    ).rejects.toBeInstanceOf(ContentFolderNotFoundError);
    await expect(
      useCase.execute("RCD-content1" as ContentId, {
        folderId: ROOT_FOLDER_ID,
        contentType: "news",
        data: { title: "Updated" }
      })
    ).rejects.toBeInstanceOf(ImmutableContentTypeError);
    await expect(
      useCase.execute("RCD-content1" as ContentId, {
        folderId: ROOT_FOLDER_ID,
        schemaVersion: "9.0",
        data: { title: "Updated" }
      })
    ).rejects.toBeInstanceOf(ContentTypeSchemaNotFoundError);
    await expect(
      useCase.execute("RCD-content1" as ContentId, {
        folderId: ROOT_FOLDER_ID,
        data: { title: 1 }
      })
    ).rejects.toBeInstanceOf(InvalidContentDataError);
  });

  it("GIVEN content exists WHEN patched THEN data is merged and version increments", async () => {
    const { repository, folderRepository, schemaReader } = fixtures();
    await repository.save(
      content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now, "2.0", {
        title: "Welcome",
        priority: 1
      })
    );

    const record = await new PatchContentUseCase(
      repository,
      folderRepository,
      schemaReader,
      () => later
    ).execute("RCD-content1" as ContentId, { data: { priority: 2 } });

    expect(record).toMatchObject({
      version: 2,
      data: { title: "Welcome", priority: 2 }
    });
    expect(record.updatedAt).toEqual(later);
  });

  it("GIVEN content exists WHEN patched with folder and schema THEN assignments are updated", async () => {
    const { repository, folderRepository, schemaReader, childFolderId } = fixtures();
    await repository.save(content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now));

    const record = await new PatchContentUseCase(repository, folderRepository, schemaReader).execute(
      "RCD-content1" as ContentId,
      {
        folderId: childFolderId,
        schemaVersion: "2.0",
        data: { priority: 2 }
      }
    );

    expect(record.folderId).toBe(childFolderId);
    expect(record.schemaVersion).toBe("2.0");
  });

  it("GIVEN invalid patch inputs WHEN patched THEN expected errors are thrown", async () => {
    const { repository, folderRepository, schemaReader } = fixtures();
    await repository.save(content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now));
    const useCase = new PatchContentUseCase(repository, folderRepository, schemaReader);

    await expect(
      useCase.execute("RCD-missing" as ContentId, { data: { title: "Updated" } })
    ).rejects.toBeInstanceOf(ContentNotFoundError);
    await expect(
      useCase.execute("RCD-content1" as ContentId, { folderId: "FLD-missing" as FolderId })
    ).rejects.toBeInstanceOf(ContentFolderNotFoundError);
    await expect(
      useCase.execute("RCD-content1" as ContentId, { contentType: "news" })
    ).rejects.toBeInstanceOf(ImmutableContentTypeError);
    await expect(
      useCase.execute("RCD-content1" as ContentId, { schemaVersion: "9.0" })
    ).rejects.toBeInstanceOf(ContentTypeSchemaNotFoundError);
    await expect(
      useCase.execute("RCD-content1" as ContentId, { data: { title: 1 } })
    ).rejects.toBeInstanceOf(InvalidContentDataError);
  });

  it("GIVEN content exists WHEN deleted THEN it is hard deleted and occupancy changes", async () => {
    const repository = new InMemoryContentRepository([
      content("RCD-content1" as ContentId, ROOT_FOLDER_ID, now)
    ]);

    await expect(repository.hasAssignedContent(ROOT_FOLDER_ID)).resolves.toBe(true);
    await new DeleteContentUseCase(repository).execute("RCD-content1" as ContentId);

    await expect(repository.findById("RCD-content1" as ContentId)).resolves.toBeNull();
    await expect(repository.hasAssignedContent(ROOT_FOLDER_ID)).resolves.toBe(false);
  });

  it("GIVEN content is missing WHEN deleted THEN content not found is thrown", async () => {
    await expect(
      new DeleteContentUseCase(new InMemoryContentRepository()).execute("RCD-missing" as ContentId)
    ).rejects.toBeInstanceOf(ContentNotFoundError);
  });
});

function newCreateUseCase({ now }: { now: Date }): CreateContentUseCase {
  const { repository, folderRepository, schemaReader } = fixtures();

  return new CreateContentUseCase(
    repository,
    folderRepository,
    schemaReader,
    new StaticContentIdGenerator("RCD-generated" as ContentId),
    () => now
  );
}

function fixtures(): {
  repository: InMemoryContentRepository;
  folderRepository: InMemoryFolderRepository;
  schemaReader: InMemoryContentTypeSchemaReader;
  childFolderId: FolderId;
} {
  const root = createRootFolder(new Date("2026-06-29T10:00:00.000Z"));
  const child = createFolderRecord({
    folderId: "FLD-folder1" as FolderId,
    name: "folder1",
    parent: root,
    now: root.createdAt
  });

  return {
    repository: new InMemoryContentRepository(),
    folderRepository: new InMemoryFolderRepository([root, child]),
    schemaReader: new InMemoryContentTypeSchemaReader([
      schema("article", "1.0", [{ name: "title", type: "string", required: true }]),
      schema("article", "2.0", [
        { name: "title", type: "string", required: true },
        { name: "priority", type: "integer", required: true }
      ])
    ]),
    childFolderId: child.folderId
  };
}

function content(
  contentId: ContentId,
  folderId: FolderId,
  now: Date,
  schemaVersion = "1.0",
  data: ContentInstanceData = { title: "Welcome" }
) {
  return createContentRecord({
    contentId,
    folderId,
    contentType: "article",
    schemaVersion,
    data,
    now
  });
}

function schema(
  name: string,
  version: string,
  fields: ContentTypeSchemaDefinition["fields"]
): ContentTypeSchemaDefinition {
  return { name, version, fields };
}

class StaticContentIdGenerator implements ContentIdGenerator {
  constructor(private readonly contentId: ContentId) {}

  next(): ContentId {
    return this.contentId;
  }
}
