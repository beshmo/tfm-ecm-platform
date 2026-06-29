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

  it("GIVEN a content type request WHEN proxied THEN it forwards to the Content Type Service", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { name: "generic", version: "1.0" }));

    await request(app.getHttpServer())
      .get("/api/management/content-types/generic/versions/1.0")
      .expect(200)
      .expect({ name: "generic", version: "1.0" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3003/api/management/content-types/generic/versions/1.0",
      expect.objectContaining({ method: "GET" })
    );
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
