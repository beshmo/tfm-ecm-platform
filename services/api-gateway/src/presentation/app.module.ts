import { Module } from "@nestjs/common";

import { CmisProxyController } from "./cmis-proxy.controller";
import { HealthController } from "./health.controller";
import { ManagementProxyController } from "./management-proxy.controller";

@Module({
  controllers: [HealthController, ManagementProxyController, CmisProxyController]
})
export class AppModule {}
