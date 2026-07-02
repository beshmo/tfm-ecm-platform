import { Module } from "@nestjs/common";

import { CmisController } from "./cmis.controller";
import { ContentsController } from "./contents.controller";
import { contentTypeSchemaProviders } from "./content-type-schema.providers";
import { ContentTypeSchemasController } from "./content-type-schemas.controller";
import { FilesController } from "./files.controller";
import { folderProviders } from "./folder.providers";
import { FoldersController } from "./folders.controller";
import { HealthController } from "./health.controller";

@Module({
  controllers: [
    HealthController,
    FoldersController,
    ContentsController,
    FilesController,
    CmisController,
    ContentTypeSchemasController
  ],
  providers: [...folderProviders, ...contentTypeSchemaProviders]
})
export class AppModule {}
