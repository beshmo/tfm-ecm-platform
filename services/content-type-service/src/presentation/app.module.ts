import { Module } from "@nestjs/common";

import { contentTypeSchemaProviders } from "./content-type-schema.providers";
import { ContentTypeSchemasController } from "./content-type-schemas.controller";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController, ContentTypeSchemasController],
  providers: [...contentTypeSchemaProviders]
})
export class AppModule {}
