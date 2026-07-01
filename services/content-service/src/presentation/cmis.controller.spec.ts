import { CMIS_REPOSITORY_ID } from "@ecmp/shared-types";
import type { StaticFileStorage, StaticFileStorageSaveInput } from "../domain/static-file.storage";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppModule } from "./app.module";
import { STATIC_FILE_STORAGE } from "./folder.providers";

describe("content-service CMIS Browser Binding adapter", () => {
  let app: INestApplication | null = null;
  let storage: MemoryStaticFileStorage;

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  it("GIVEN CMIS service document and repository requests WHEN sent THEN repository metadata is returned", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .get("/api/cmis")
      .expect(200)
      .expect((response) => {
        expect(response.body.repositories[CMIS_REPOSITORY_ID]).toMatchObject({
          repositoryId: CMIS_REPOSITORY_ID,
          cmisVersionSupported: "1.1",
          capabilities: { navigation: true, query: false }
        });
      });

    await request(app.getHttpServer())
      .get(`/api/cmis/${CMIS_REPOSITORY_ID}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.rootFolderId).toBe("FLD-root");
      });
  });

  it("GIVEN CMIS type discovery WHEN requested THEN base, content type definition, and ECMP content types are returned", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .get(`/api/cmis/${CMIS_REPOSITORY_ID}/types`)
      .expect(200)
      .expect((response) => {
        const types = response.body.types as Array<{
          id: string;
          baseId: string;
          parentId: string | null;
          displayName: string;
          typeMutability: { create: boolean; update: boolean; delete: boolean };
        }>;

        expect(types.map((type) => type.id)).toEqual([
          "cmis:folder",
          "cmis:document",
          "cmis:item",
          "ecmp:content-type-definition",
          "ecmp:generic"
        ]);

        // Binary content uses Document terminology in the object-type model.
        const documentType = types.find((type) => type.id === "cmis:document");
        expect(documentType?.displayName).toBe("Document Type");

        // Content Type Definition is the common parent of user content types.
        const contentTypeDefinition = types.find((type) => type.id === "ecmp:content-type-definition");
        expect(contentTypeDefinition).toMatchObject({ baseId: "cmis:item", parentId: "cmis:item" });
        const generic = types.find((type) => type.id === "ecmp:generic");
        expect(generic).toMatchObject({
          baseId: "cmis:item",
          parentId: "ecmp:content-type-definition"
        });

        // Every returned type definition exposes the CMIS 1.1 common object-type
        // attributes with conservative unsupported-behavior flags.
        for (const type of types) {
          expect(type).toEqual(
            expect.objectContaining({
              localName: expect.any(String),
              localNamespace: expect.any(String),
              queryName: expect.any(String),
              displayName: expect.any(String),
              description: expect.any(String),
              baseId: expect.any(String),
              queryable: false,
              controllablePolicy: false,
              controllableACL: false,
              fulltextIndexed: false,
              includedInSupertypeQuery: false,
              typeMutability: { create: false, update: false, delete: false }
            })
          );
          expect(type).toHaveProperty("parentId");
        }

        // Unsupported optional base types are not advertised.
        const typeIds = types.map((type) => type.id);
        expect(typeIds).not.toContain("cmis:relationship");
        expect(typeIds).not.toContain("cmis:policy");
        expect(typeIds).not.toContain("cmis:secondary");
      });
  });

  it("GIVEN folder content exists WHEN CMIS children are requested THEN mapped objects are returned", async () => {
    app = await createApp();
    const folder = await createFolder("folder1");
    const content = await createContent(folder.folderId);
    const file = await createDocument(folder.folderId);

    await request(app.getHttpServer())
      .get(`/api/cmis/${CMIS_REPOSITORY_ID}/children/${folder.folderId}`)
      .set("x-ecmp-permissions", "folder:read,file:read,generic:read")
      .expect(200)
      .expect((response) => {
        const objectIds = response.body.objects.map((object: { objectId: string }) => object.objectId);

        expect(objectIds).toEqual([file.objectId, content.contentId]);
        expect(response.body.objects[0]).toMatchObject({
          typeId: "cmis:document",
          allowableActions: { canGetContentStream: true, canDeleteObject: false }
        });
      });
  });

  it("GIVEN objects exist WHEN looked up by ID and path THEN CMIS objects are returned", async () => {
    app = await createApp();
    const folder = await createFolder("folder1");
    const file = await createDocument(folder.folderId);

    await request(app.getHttpServer())
      .get(`/api/cmis/${CMIS_REPOSITORY_ID}/object/${folder.folderId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          objectId: folder.folderId,
          typeId: "cmis:folder",
          path: "/folder1"
        });
      });

    await request(app.getHttpServer())
      .get(`/api/cmis/${CMIS_REPOSITORY_ID}/object-by-path`)
      .query({ path: "/folder1/manual.pdf" })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          objectId: file.objectId,
          typeId: "cmis:document"
        });
      });
  });

  it("GIVEN a static-file-backed document exists WHEN content stream is requested THEN binary is returned", async () => {
    app = await createApp();
    const file = await createDocument("FLD-root");

    await request(app.getHttpServer())
      .get(`/api/cmis/${CMIS_REPOSITORY_ID}/content/${file.objectId}`)
      .expect(200)
      .expect("content-type", "application/pdf")
      .expect((response) => {
        expect(response.body).toEqual(Buffer.from("content"));
      });
  });

  it("GIVEN CMIS create and delete requests WHEN valid THEN ECMP use cases are applied", async () => {
    app = await createApp();

    const folderResponse = await request(app.getHttpServer())
      .post(`/api/cmis/${CMIS_REPOSITORY_ID}/folders`)
      .send({ name: "folder1", parentId: "FLD-root" })
      .expect(201);
    const folder = folderResponse.body as { objectId: string };
    const file = await createDocument(folder.objectId);

    await request(app.getHttpServer())
      .delete(`/api/cmis/${CMIS_REPOSITORY_ID}/object/${file.objectId}`)
      .expect(200)
      .expect({ deleted: true, objectId: file.objectId });

    await request(app.getHttpServer())
      .delete(`/api/cmis/${CMIS_REPOSITORY_ID}/object/${folder.objectId}`)
      .expect(200)
      .expect({ deleted: true, objectId: folder.objectId });
  });

  it("GIVEN unsupported or forbidden CMIS requests WHEN sent THEN CMIS errors are returned", async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .get("/api/cmis/missing-repository")
      .expect(404)
      .expect({
        exception: "notFound",
        message: "CMIS repository 'missing-repository' was not found."
      });

    await request(app.getHttpServer())
      .post(`/api/cmis/${CMIS_REPOSITORY_ID}/folders`)
      .set("x-ecmp-permissions", "folder:read")
      .send({ name: "folder1", parentId: "FLD-root" })
      .expect(403)
      .expect({ exception: "permissionDenied", message: "Permission 'folder:create' is required." });

    await request(app.getHttpServer())
      .post("/api/cmis/query")
      .expect(405)
      .expect({
        exception: "notSupported",
        message: "The requested CMIS service is not supported by this repository."
      });
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

  async function createFolder(name: string): Promise<{ folderId: string; path: string }> {
    const response = await request(app!.getHttpServer())
      .post("/api/management/folders")
      .send({ name, parentFolderId: "FLD-root" })
      .expect(201);

    return response.body as { folderId: string; path: string };
  }

  async function createContent(folderId: string): Promise<{ contentId: string }> {
    const response = await request(app!.getHttpServer())
      .post("/api/management/contents")
      .send({
        folderId,
        contentType: "generic",
        data: { title: "Welcome" }
      })
      .expect(201);

    return response.body as { contentId: string };
  }

  async function createDocument(parentId: string): Promise<{ objectId: string }> {
    const response = await request(app!.getHttpServer())
      .post(`/api/cmis/${CMIS_REPOSITORY_ID}/documents`)
      .field("parentId", parentId)
      .attach("file", Buffer.from("content"), {
        filename: "manual.pdf",
        contentType: "application/pdf"
      })
      .expect(201);

    return response.body as { objectId: string };
  }
});

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
