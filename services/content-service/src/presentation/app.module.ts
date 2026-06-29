import { Module } from "@nestjs/common";

import { folderProviders } from "./folder.providers";
import { FoldersController } from "./folders.controller";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController, FoldersController],
  providers: [...folderProviders]
})
export class AppModule {}
