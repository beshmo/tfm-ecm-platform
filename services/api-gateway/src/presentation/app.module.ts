import { Module } from "@nestjs/common";

import { HealthController } from "./health.controller";
import { ManagementProxyController } from "./management-proxy.controller";

@Module({
  controllers: [HealthController, ManagementProxyController]
})
export class AppModule {}
