import { INITIAL_GENERIC_CONTENT_TYPE_SCHEMA } from "@ecmp/shared-types";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "./app.module";

describe("content-type-service schema endpoints", () => {
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

  it("GIVEN valid YAML WHEN a schema is created THEN the endpoint stores and returns it", async () => {
    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({ schemaSource: schemaSource("article", "1.0") })
      .expect(201)
      .expect({
        name: "article",
        version: "1.0",
        fields: [{ name: "title", type: "string", required: true }]
      });

    await request(app.getHttpServer())
      .get("/api/management/content-types/article")
      .expect(200)
      .expect({
        name: "article",
        version: "1.0",
        fields: [{ name: "title", type: "string", required: true }]
      });
  });

  it("GIVEN an active schema WHEN it is replaced THEN the endpoint returns the replacement", async () => {
    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({ schemaSource: schemaSource("article", "1.0") })
      .expect(201);

    await request(app.getHttpServer())
      .put("/api/management/content-types/article/versions/1.0")
      .send({ schemaSource: schemaSource("article", "1.0", "headline") })
      .expect(200)
      .expect({
        name: "article",
        version: "1.0",
        fields: [{ name: "headline", type: "string", required: true }]
      });
  });

  it("GIVEN an active schema WHEN it is deactivated THEN it is excluded from active lists but remains explicitly retrievable", async () => {
    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({ schemaSource: schemaSource("article", "1.0") })
      .expect(201);

    await request(app.getHttpServer())
      .delete("/api/management/content-types/article/versions/1.0")
      .expect(204);

    await request(app.getHttpServer())
      .get("/api/management/content-types")
      .expect(200)
      .expect([{ name: "generic", version: "1.0", active: true }]);

    await request(app.getHttpServer())
      .get("/api/management/content-types/article/versions/1.0")
      .expect(200)
      .expect({
        name: "article",
        version: "1.0",
        fields: [{ name: "title", type: "string", required: true }]
      });
  });

  it("GIVEN malformed schema write bodies WHEN submitted THEN the endpoint returns validation errors", async () => {
    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({})
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: "Content type schema request is invalid.",
          errors: [{ message: "schemaSource must be a string." }]
        });
      });

    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({ schemaSource: "name: [" })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: "Content type schema is invalid.",
          errors: [{ message: "Schema source must be valid YAML." }]
        });
      });
  });

  it("GIVEN conflicting schema write requests WHEN submitted THEN the endpoint returns conflict responses", async () => {
    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({ schemaSource: schemaSource("article", "1.0") })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({ schemaSource: schemaSource("article", "1.0") })
      .expect(409);

    await request(app.getHttpServer())
      .put("/api/management/content-types/article/versions/1.0")
      .send({ schemaSource: schemaSource("article", "2.0") })
      .expect(409);

    await request(app.getHttpServer())
      .delete("/api/management/content-types/article/versions/1.0")
      .expect(204);

    await request(app.getHttpServer())
      .put("/api/management/content-types/article/versions/1.0")
      .send({ schemaSource: schemaSource("article", "1.0", "headline") })
      .expect(409);
  });

  it("GIVEN missing schema write targets WHEN submitted THEN the endpoint returns 404", async () => {
    await request(app.getHttpServer())
      .put("/api/management/content-types/article/versions/1.0")
      .send({ schemaSource: schemaSource("article", "1.0") })
      .expect(404);

    await request(app.getHttpServer())
      .delete("/api/management/content-types/article/versions/1.0")
      .expect(404);
  });

  it("GIVEN oversized YAML source WHEN submitted THEN the endpoint returns 413", async () => {
    await request(app.getHttpServer())
      .post("/api/management/content-types")
      .send({ schemaSource: `${schemaSource("article", "1.0")}${"a".repeat(70 * 1024)}` })
      .expect(413)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: "Content type schema source exceeds the maximum allowed size."
        });
      });
  });
});

function schemaSource(name: string, version: string, fieldName = "title"): string {
  return `
name: ${name}
version: ${version}
fields:
  - name: ${fieldName}
    type: string
    required: true
`;
}
