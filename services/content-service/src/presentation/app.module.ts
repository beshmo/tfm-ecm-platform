import { Module } from "@nestjs/common";

import { ContentsController } from "./contents.controller";
import { folderProviders } from "./folder.providers";
import { FoldersController } from "./folders.controller";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController, FoldersController, ContentsController],
  providers: [...folderProviders]
})
export class AppModule {}
