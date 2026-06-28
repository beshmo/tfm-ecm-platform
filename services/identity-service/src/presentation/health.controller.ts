import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@ecmp/shared-types";

@Controller()
export class HealthController {
  @Get("health")
  health(): HealthResponse {
    return {
      service: "identity-service",
      status: "ok"
    };
  }
}
