import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StaticFileStorage, StaticFileStorageSaveInput } from "../domain/static-file.storage";
import { AppModule } from "./app.module";
import { STATIC_FILE_STORAGE } from "./folder.providers";

describe("content-service document management endpoints", () => {
  let app: INestApplication | null = null;
  let storage: MemoryStaticFileStorage;

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  it("GIVEN a document is uploaded WHEN listed and retrieved THEN document metadata is returned", async () => {
    app = await createApp();
    const uploaded = await uploadFile(app);

    await request(app.getHttpServer())
      .get("/api/management/files?folderId=FLD-root")
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
          fileId: uploaded.fileId,
          folderId: "FLD-root",
          filename: "manual.pdf",
          mimeType: "application/pdf",
          size: 7
        });
      });

    await request(app.getHttpServer())
      .get(`/api/management/files/${uploaded.fileId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.fileId).toBe(uploaded.fileId);
      });
  });

  it("GIVEN valid upload and metadata requests WHEN sent THEN expected statuses are returned", async () => {
    app = await createApp();
    const uploaded = await uploadFile(app);

    await request(app.getHttpServer())
      .patch(`/api/management/files/${uploaded.fileId}`)
      .send({ filename: "manual-v2.pdf" })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          fileId: uploaded.fileId,
          filename: "manual-v2.pdf"
        });
      });

    await request(app.getHttpServer())
      .delete(`/api/management/files/${uploaded.fileId}`)
      .expect(204);

    expect(storage.deletedPaths).toEqual([`stored/${uploaded.fileId}`]);
  });

  it("GIVEN malformed file requests WHEN sent THEN the endpoint returns 400", async () => {
    app = await createApp();
    const uploaded = await uploadFile(app);

    await request(app.getHttpServer())
      .get("/api/management/files")
      .expect(400);

    await request(app.getHttpServer())
      .post("/api/management/files")
      .field("folderId", "FLD-root")
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/management/files/${uploaded.fileId}`)
      .send({ filename: "bad:name.pdf" })
      .expect(400);
  });

  it("GIVEN missing resources WHEN requested THEN the endpoint returns 404", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .get("/api/management/files/STF-missing")
      .expect(404);

    await request(app.getHttpServer())
      .post("/api/management/files")
      .field("folderId", "FLD-missing")
      .attach("file", Buffer.from("content"), {
        filename: "manual.pdf",
        contentType: "application/pdf"
      })
      .expect(404);

    await request(app.getHttpServer())
      .delete("/api/management/files/STF-missing")
      .expect(404);
  });

  it("GIVEN unsupported or oversized uploads WHEN posted THEN media and size status codes are returned", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .post("/api/management/files")
      .field("folderId", "FLD-root")
      .attach("file", Buffer.from("content"), {
        filename: "app.exe",
        contentType: "application/x-msdownload"
      })
      .expect(415);

    await request(app.getHttpServer())
      .post("/api/management/files")
      .field("folderId", "FLD-root")
      .attach("file", Buffer.alloc(10 * 1024 * 1024 + 1), {
        filename: "large.pdf",
        contentType: "application/pdf"
      })
      .expect(413);
  });

  it("GIVEN storage cleanup fails WHEN deleted THEN the endpoint returns 500", async () => {
    app = await createApp();
    const uploaded = await uploadFile(app);
    storage.deleteMock.mockRejectedValueOnce(new Error("disk failure"));

    await request(app.getHttpServer())
      .delete(`/api/management/files/${uploaded.fileId}`)
      .expect(500);
  });

  async function createApp(): Promise<INestApplication> {
    storage = new MemoryStaticFileStorage();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(STATIC_FILE_STORAGE)
      .useValue(storage)
      .compile();
    const nextApp = moduleRef.createNestApplication();

    await nextApp.init();

    return nextApp;
  }
});

async function uploadFile(app: INestApplication): Promise<{ fileId: string }> {
  const response = await request(app.getHttpServer())
    .post("/api/management/files")
    .field("folderId", "FLD-root")
    .attach("file", Buffer.from("content"), {
      filename: "manual.pdf",
      contentType: "application/pdf"
    })
    .expect(201);

  return response.body as { fileId: string };
}

class MemoryStaticFileStorage implements StaticFileStorage {
  readonly deletedPaths: string[] = [];
  readonly deleteMock = vi.fn(async (path: string) => {
    this.deletedPaths.push(path);
  });
  readonly files = new Map<string, Buffer>();

  async save(input: StaticFileStorageSaveInput): Promise<{ path: string }> {
    const path = `stored/${input.fileId}`;

    this.files.set(path, input.buffer);

    return { path };
  }

  async read(path: string): Promise<Buffer> {
    const file = this.files.get(path);

    if (!file) {
      throw new Error("missing file");
    }

    return file;
  }

  async delete(path: string): Promise<void> {
    await this.deleteMock(path);
  }
}
