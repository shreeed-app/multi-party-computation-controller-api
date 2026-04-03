import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@/app.module";
import { AppConfigService } from "@/common/config/config.service";

/**
 * Bootstraps the NestJS application.
 *
 * Sets up:
 *
 * - `ValidationPipe` with `whitelist` and `transform` so that DTOs are
 *   auto-validated and class-transformer coercions are applied.
 * - Shutdown hooks so BullMQ workers and Redis connections are drained
 *   gracefully on SIGTERM/SIGINT.
 */
const bootstrap = async (): Promise<void> => {
  const app: INestApplication = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  // Read port through the validated config service to stay consistent with
  // all other env var access paths and avoid bypassing Zod validation.
  const port: number = app.get(AppConfigService).port;
  await app.listen(port);
};

bootstrap();
