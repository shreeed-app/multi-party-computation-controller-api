import { type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type App } from "supertest/types";

import { AppModule } from "@/app.module";

const bootstrap = async (): Promise<void> => {
  const app: INestApplication<App> = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
};

(async () => await bootstrap())();
