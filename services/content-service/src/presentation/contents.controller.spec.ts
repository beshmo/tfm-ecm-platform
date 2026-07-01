import {
  INITIAL_GENERIC_CONTENT_TYPE_SCHEMA,
  type ContentTypeSchemaDefinition
} from "@ecmp/shared-types";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { InMemoryContentTypeSchemaReader } from "../infrastructure/in-memory-content-type-schema.reader";
import { AppModule } from "./app.module";
import { CONTENT_TYPE_SCHEMA_READER } from "./folder.providers";

describe("content-service content management endpoints", () => {
  let app: INestApplication | null = null;

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  it("GIVEN content exists WHEN listed and retrieved THEN content records are returned", async () => {
    app = await createApp();
    const content = await createContent(app, { title: "Welcome" });

    await request(app.getHttpServer())
      .get("/api/management/contents")
      .expect(200)
      .expect((response) => {
        expect(response.body[0]).toMatchObject({
          contentId: content.contentId,
          folderId: "FLD-root",
          contentType: "article",
          schemaVersion: "1.0",
          version: 1,
          status: "draft",
          data: { title: "Welcome" }
        });
      });

    await request(app.getHttpServer())
      .get(`/api/management/contents/${content.contentId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.contentId).toBe(content.contentId);
      });
  }, 10000);

  it("GIVEN content exists in folders WHEN listed by folder THEN only matching records are returned", async () => {
    app = await createApp();
    const folder = await createFolder(app, "folder1");
    await createContent(app, { title: "Root" });
    const childContent = await createContent(app, { title: "Child" }, folder.folderId);

    await request(app.getHttpServer())
      .get(`/api/management/contents?folderId=${folder.folderId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].contentId).toBe(childContent.contentId);
      });
  });

  it("GIVEN valid create requests WHEN posted THEN content is created with status 201", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .post("/api/management/contents")
      .send({
        folderId: "FLD-root",
        contentType: "article",
        data: { title: "Welcome", priority: 1 }
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.contentId).toMatch(/^RCD-/);
        expect(response.body).toMatchObject({
          folderId: "FLD-root",
          contentType: "article",
          schemaVersion: "2.0",
          version: 1,
          status: "draft"
        });
      });
  });

  it("GIVEN the default generic schema WHEN posted without schema version THEN content is created with schema version 1.0", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(CONTENT_TYPE_SCHEMA_READER)
      .useValue(new InMemoryContentTypeSchemaReader([INITIAL_GENERIC_CONTENT_TYPE_SCHEMA]))
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/management/contents")
      .send({
        folderId: "FLD-root",
        contentType: "generic",
        data: { title: "Welcome" }
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          folderId: "FLD-root",
          contentType: "generic",
          schemaVersion: "1.0",
          data: { title: "Welcome" }
        });
      });
  });

  it("GIVEN content exists WHEN replaced THEN the updated record is returned", async () => {
    app = await createApp();
    const content = await createContent(app, { title: "Welcome" });

    await request(app.getHttpServer())
      .put(`/api/management/contents/${content.contentId}`)
      .send({
        folderId: "FLD-root",
        contentType: "article",
        data: { title: "Updated" }
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          contentId: content.contentId,
          version: 2,
          data: { title: "Updated" }
        });
      });
  });

  it("GIVEN content exists WHEN patched THEN shallow data changes are returned", async () => {
    app = await createApp();
    const content = await createContent(app, { title: "Welcome", priority: 1 }, "FLD-root", "2.0");

    await request(app.getHttpServer())
      .patch(`/api/management/contents/${content.contentId}`)
      .send({ data: { priority: 2 } })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          contentId: content.contentId,
          version: 2,
          data: { title: "Welcome", priority: 2 }
        });
      });
  });

  it("GIVEN content exists WHEN deleted THEN the endpoint returns 204 and hard deletes it", async () => {
    app = await createApp();
    const content = await createContent(app, { title: "Welcome" });

    await request(app.getHttpServer())
      .delete(`/api/management/contents/${content.contentId}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/management/contents/${content.contentId}`)
      .expect(404);
  });

  it("GIVEN malformed bodies or invalid data WHEN sent THEN the endpoint returns 400", async () => {
    app = await createApp();
    const content = await createContent(app, { title: "Welcome" });

    await request(app.getHttpServer())
      .post("/api/management/contents")
      .send({ folderId: "FLD-root", contentType: "article" })
      .expect(400);

    await request(app.getHttpServer())
      .post("/api/management/contents")
      .send({ folderId: "FLD-root", contentType: "article", schemaVersion: "1.0", data: { title: 1 } })
      .expect(400)
      .expect((response) => {
        expect(response.body.errors[0]).toMatchObject({ code: "INVALID_STRING" });
      });

    await request(app.getHttpServer())
      .patch(`/api/management/contents/${content.contentId}`)
      .send({ data: [] })
      .expect(400);
  });

  it("GIVEN missing resources WHEN requested THEN the endpoint returns 404", async () => {
    app = await createApp();
    const content = await createContent(app, { title: "Welcome" });

    await request(app.getHttpServer())
      .get("/api/management/contents/RCD-missing")
      .expect(404);

    await request(app.getHttpServer())
      .post("/api/management/contents")
      .send({ folderId: "FLD-missing", contentType: "article", data: { title: "Welcome" } })
      .expect(404);

    await request(app.getHttpServer())
      .put(`/api/management/contents/${content.contentId}`)
      .send({ folderId: "FLD-root", schemaVersion: "9.0", data: { title: "Welcome" } })
      .expect(404);
  });

  it("GIVEN immutable content type conflict WHEN updated THEN the endpoint returns 409", async () => {
    app = await createApp();
    const content = await createContent(app, { title: "Welcome" });

    await request(app.getHttpServer())
      .put(`/api/management/contents/${content.contentId}`)
      .send({ folderId: "FLD-root", contentType: "news", data: { title: "Updated" } })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/api/management/contents/${content.contentId}`)
      .send({ contentType: "news" })
      .expect(409);
  });

  it("GIVEN a folder has assigned content WHEN deleted THEN folder endpoint returns 409", async () => {
    app = await createApp();
    const folder = await createFolder(app, "folder1");
    await createContent(app, { title: "Assigned" }, folder.folderId);

    await request(app.getHttpServer())
      .delete(`/api/management/folders/${folder.folderId}`)
      .expect(409);
  });
});

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule]
  })
    .overrideProvider(CONTENT_TYPE_SCHEMA_READER)
    .useValue(
      new InMemoryContentTypeSchemaReader([
        schema("article", "1.0", { title: { type: "string", required: true } }),
        schema("article", "2.0", {
          title: { type: "string", required: true },
          priority: { type: "integer", required: true }
        })
      ])
    )
    .compile();
  const app = moduleRef.createNestApplication();

  await app.init();

  return app;
}

async function createFolder(
  app: INestApplication,
  name: string
): Promise<{ folderId: string; name: string; path: string }> {
  const response = await request(app.getHttpServer())
    .post("/api/management/folders")
    .send({ name, parentFolderId: "FLD-root" })
    .expect(201);

  return response.body as { folderId: string; name: string; path: string };
}

async function createContent(
  app: INestApplication,
  data: Record<string, unknown>,
  folderId = "FLD-root",
  schemaVersion = "1.0"
): Promise<{ contentId: string; folderId: string; version: number }> {
  const response = await request(app.getHttpServer())
    .post("/api/management/contents")
    .send({ folderId, contentType: "article", schemaVersion, data })
    .expect(201);

  return response.body as { contentId: string; folderId: string; version: number };
}

function schema(
  name: string,
  version: string,
  fields: ContentTypeSchemaDefinition["fields"]
): ContentTypeSchemaDefinition {
  return { name, version, fields };
}
