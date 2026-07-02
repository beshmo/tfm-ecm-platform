import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppModule } from "./app.module";

describe("api-gateway management proxy", () => {
  let app: INestApplication;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllGlobals();
  });

  it("GIVEN a folder list request WHEN proxied THEN it forwards to the Content Service", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, [{ folderId: "FLD-root" }]));

    await request(app.getHttpServer())
      .get("/api/management/folders?parentFolderId=FLD-root")
      .expect(200)
      .expect([{ folderId: "FLD-root" }]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/management/folders?parentFolderId=FLD-root",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("GIVEN a content mutation request WHEN proxied THEN it forwards method, path, query, and body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { contentId: "RCD-1" }));

    await request(app.getHttpServer())
      .post("/api/management/contents?folderId=FLD-root")
      .send({ folderId: "FLD-root", contentType: "generic", data: { title: "Welcome" } })
      .expect(201)
      .expect({ contentId: "RCD-1" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/management/contents?folderId=FLD-root",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          folderId: "FLD-root",
          contentType: "generic",
          data: { title: "Welcome" }
        })
      })
    );
  });

  it("GIVEN a content type request WHEN proxied THEN it forwards to the Content Service", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { name: "generic", version: "1.0" }));

    await request(app.getHttpServer())
      .get("/api/management/content-types/generic/versions/1.0")
      .expect(200)
      .expect({ name: "generic", version: "1.0" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/management/content-types/generic/versions/1.0",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("GIVEN a content type create request WHEN proxied THEN it forwards JSON body to the Content Service", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { name: "article", version: "1.0" }));

    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({ schemaSource: "name: article\nversion: 1.0\nfields: {}" })
      .expect(201)
      .expect({ name: "article", version: "1.0" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/management/content-types",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          schemaSource: "name: article\nversion: 1.0\nfields: {}"
        })
      })
    );
  });

  it("GIVEN a content type replace request WHEN proxied THEN it forwards method, path, and body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { name: "article", version: "1.0" }));

    await request(app.getHttpServer())
      .put("/api/management/content-types/article/versions/1.0")
      .send({ schemaSource: "name: article\nversion: 1.0\nfields: {}" })
      .expect(200)
      .expect({ name: "article", version: "1.0" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/management/content-types/article/versions/1.0",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          schemaSource: "name: article\nversion: 1.0\nfields: {}"
        })
      })
    );
  });

  it("GIVEN a content type deactivate request WHEN proxied THEN it forwards method and path", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await request(app.getHttpServer())
      .delete("/api/management/content-types/article/versions/1.0")
      .expect(204);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/management/content-types/article/versions/1.0",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("GIVEN a file metadata request WHEN proxied THEN it forwards to the Content Service", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, [{ fileId: "STF-1" }]));

    await request(app.getHttpServer())
      .get("/api/management/files?folderId=FLD-root")
      .expect(200)
      .expect([{ fileId: "STF-1" }]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/management/files?folderId=FLD-root",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("GIVEN a file metadata mutation WHEN proxied THEN it forwards JSON body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { fileId: "STF-1", filename: "new.pdf" }));

    await request(app.getHttpServer())
      .patch("/api/management/files/STF-1")
      .send({ filename: "new.pdf" })
      .expect(200)
      .expect({ fileId: "STF-1", filename: "new.pdf" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/management/files/STF-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ filename: "new.pdf" })
      })
    );
  });

  it("GIVEN a file upload request WHEN proxied THEN it preserves multipart content type", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { fileId: "STF-1" }));

    await request(app.getHttpServer())
      .post("/api/management/files")
      .field("folderId", "FLD-root")
      .attach("file", Buffer.from("content"), {
        filename: "manual.pdf",
        contentType: "application/pdf"
      })
      .expect(201)
      .expect({ fileId: "STF-1" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit & { duplex?: string }];
    const headers = init.headers as Headers;

    expect(init.method).toBe("POST");
    expect(init.body).toBeDefined();
    expect(init.duplex).toBe("half");
    expect(headers.get("content-type")).toContain("multipart/form-data");
  });

  it("GIVEN a CMIS read request WHEN proxied THEN it forwards to the Content Service", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { repositoryId: "ecmp-management" }));

    await request(app.getHttpServer())
      .get("/api/cmis/ecmp-management/types")
      .expect(200)
      .expect({ repositoryId: "ecmp-management" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/cmis/ecmp-management/types",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("GIVEN a CMIS form request WHEN proxied THEN it preserves form content type and body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { objectId: "FLD-1" }));

    await request(app.getHttpServer())
      .post("/api/cmis/ecmp-management/folders")
      .type("form")
      .send({ parentId: "FLD-root", name: "folder1" })
      .expect(201)
      .expect({ objectId: "FLD-1" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(init.method).toBe("POST");
    expect(headers.get("content-type")).toContain("application/x-www-form-urlencoded");
    expect(String(init.body)).toBe("parentId=FLD-root&name=folder1");
  });

  it("GIVEN a CMIS document upload WHEN proxied THEN it preserves multipart content type", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { objectId: "STF-1" }));

    await request(app.getHttpServer())
      .post("/api/cmis/ecmp-management/documents")
      .field("parentId", "FLD-root")
      .attach("file", Buffer.from("content"), {
        filename: "manual.pdf",
        contentType: "application/pdf"
      })
      .expect(201)
      .expect({ objectId: "STF-1" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit & { duplex?: string }];
    const headers = init.headers as Headers;

    expect(init.method).toBe("POST");
    expect(init.body).toBeDefined();
    expect(init.duplex).toBe("half");
    expect(headers.get("content-type")).toContain("multipart/form-data");
  });

  it("GIVEN a downstream API error WHEN proxied THEN it preserves status and body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { message: "Conflict" }));

    await request(app.getHttpServer())
      .delete("/api/management/folders/FLD-1")
      .expect(409)
      .expect({ message: "Conflict" });
  });

  it("GIVEN the target service is unavailable WHEN proxied THEN it returns a gateway error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    await request(app.getHttpServer())
      .get("/api/management/contents")
      .expect(502)
      .expect({ message: "Management service is unavailable." });
  });
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
