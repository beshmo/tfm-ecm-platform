import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import type { FolderContentReader } from "../domain/folder-content.reader";
import { AppModule } from "./app.module";
import { FOLDER_CONTENT_READER } from "./folder.providers";

describe("content-service folder management endpoints", () => {
  let app: INestApplication | null = null;

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  it("GIVEN root folder exists WHEN folders are listed and retrieved THEN root is returned", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .get("/api/management/folders")
      .expect(200)
      .expect((response) => {
        expect(response.body[0]).toMatchObject({
          folderId: "FLD-root",
          name: "Root",
          parentFolderId: null,
          path: "/"
        });
      });

    await request(app.getHttpServer())
      .get("/api/management/folders/FLD-root")
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          folderId: "FLD-root",
          path: "/"
        });
      });
  });

  it("GIVEN a valid create request WHEN posted THEN a folder is created with status 201", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .post("/api/management/folders")
      .send({ name: " folder1 ", parentFolderId: "FLD-root" })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          name: "folder1",
          parentFolderId: "FLD-root",
          path: "/folder1"
        });
        expect(response.body.folderId).toMatch(/^FLD-/);
        expect(response.body.createdAt).toEqual(expect.any(String));
      });
  });

  it("GIVEN direct children exist WHEN listed by parent THEN only direct children are returned", async () => {
    app = await createApp();
    const parent = await createFolder(app, "parent", "FLD-root");
    await createFolder(app, "beta", parent.folderId);
    await createFolder(app, "alpha", parent.folderId);

    await request(app.getHttpServer())
      .get(`/api/management/folders?parentFolderId=${parent.folderId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.map((folder: { name: string }) => folder.name)).toEqual([
          "alpha",
          "beta"
        ]);
      });
  });

  it("GIVEN a folder exists WHEN renamed THEN the updated folder is returned", async () => {
    app = await createApp();
    const folder = await createFolder(app, "folder1", "FLD-root");

    await request(app.getHttpServer())
      .patch(`/api/management/folders/${folder.folderId}`)
      .send({ name: "renamed" })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          folderId: folder.folderId,
          name: "renamed",
          path: "/renamed"
        });
      });
  });

  it("GIVEN an empty folder exists WHEN deleted THEN the endpoint returns 204", async () => {
    app = await createApp();
    const folder = await createFolder(app, "folder1", "FLD-root");

    await request(app.getHttpServer())
      .delete(`/api/management/folders/${folder.folderId}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/management/folders/${folder.folderId}`)
      .expect(404);
  });

  it("GIVEN malformed DTOs WHEN sent THEN the endpoint returns 400", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .post("/api/management/folders")
      .send({ name: "folder1" })
      .expect(400);

    await request(app.getHttpServer())
      .patch("/api/management/folders/FLD-root")
      .send({})
      .expect(400);
  });

  it("GIVEN an invalid name WHEN sent THEN the endpoint returns 400", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .post("/api/management/folders")
      .send({ name: "bad/name", parentFolderId: "FLD-root" })
      .expect(400);
  });

  it("GIVEN missing folders WHEN requested THEN the endpoint returns 404", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .get("/api/management/folders/FLD-missing")
      .expect(404);

    await request(app.getHttpServer())
      .post("/api/management/folders")
      .send({ name: "folder1", parentFolderId: "FLD-missing" })
      .expect(404);
  });

  it("GIVEN duplicate sibling names WHEN created THEN the endpoint returns 409", async () => {
    app = await createApp();
    await createFolder(app, "Folder1", "FLD-root");

    await request(app.getHttpServer())
      .post("/api/management/folders")
      .send({ name: "folder1", parentFolderId: "FLD-root" })
      .expect(409);
  });

  it("GIVEN root operations WHEN requested THEN the endpoint returns 409", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .patch("/api/management/folders/FLD-root")
      .send({ name: "renamed-root" })
      .expect(409);

    await request(app.getHttpServer())
      .delete("/api/management/folders/FLD-root")
      .expect(409);
  });

  it("GIVEN a folder has children WHEN deleted THEN the endpoint returns 409", async () => {
    app = await createApp();
    const parent = await createFolder(app, "parent", "FLD-root");
    await createFolder(app, "child", parent.folderId);

    await request(app.getHttpServer())
      .delete(`/api/management/folders/${parent.folderId}`)
      .expect(409);
  });

  it("GIVEN a folder has assigned content WHEN deleted THEN the endpoint returns 409", async () => {
    app = await createApp(true);
    const folder = await createFolder(app, "folder1", "FLD-root");

    await request(app.getHttpServer())
      .delete(`/api/management/folders/${folder.folderId}`)
      .expect(409);
  });
});

async function createApp(hasAssignedContent = false): Promise<INestApplication> {
  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule]
  });

  if (hasAssignedContent) {
    moduleBuilder.overrideProvider(FOLDER_CONTENT_READER).useValue({
      hasAssignedContent: async () => true
    } satisfies FolderContentReader);
  }

  const moduleRef = await moduleBuilder.compile();
  const app = moduleRef.createNestApplication();

  await app.init();

  return app;
}

async function createFolder(
  app: INestApplication,
  name: string,
  parentFolderId: string
): Promise<{ folderId: string; name: string; path: string }> {
  const response = await request(app.getHttpServer())
    .post("/api/management/folders")
    .send({ name, parentFolderId })
    .expect(201);

  return response.body as { folderId: string; name: string; path: string };
}
