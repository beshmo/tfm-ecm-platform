import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./presentation/app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env["PORT"] ?? 3006);

  await app.listen(port);
}

void bootstrap();
