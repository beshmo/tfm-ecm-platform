import { INITIAL_GENERIC_CONTENT_TYPE_SCHEMA } from "@ecmp/shared-types";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "./app.module";

describe("content-type-service schema read endpoints", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GIVEN seeded schemas WHEN listed THEN active schema summaries are returned", async () => {
    await request(app.getHttpServer())
      .get("/api/management/content-types")
      .expect(200)
      .expect([{ name: "generic", version: "1.0", active: true }]);
  });

  it("GIVEN seeded generic schema WHEN latest is requested THEN the schema definition is returned", async () => {
    await request(app.getHttpServer())
      .get("/api/management/content-types/generic")
      .expect(200)
      .expect(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA);
  });

  it("GIVEN seeded generic schema WHEN explicit version is requested THEN the schema definition is returned", async () => {
    await request(app.getHttpServer())
      .get("/api/management/content-types/generic/versions/1.0")
      .expect(200)
      .expect(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA);
  });

  it("GIVEN missing schemas WHEN requested THEN the endpoint returns 404", async () => {
    await request(app.getHttpServer())
      .get("/api/management/content-types/missing")
      .expect(404);

    await request(app.getHttpServer())
      .get("/api/management/content-types/generic/versions/9.0")
      .expect(404);
  });
});
