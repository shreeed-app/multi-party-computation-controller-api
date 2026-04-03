import { AppModule } from "@/app.module";
import { AppConfigService } from "@/common/config/config.service";
import { Environment } from "@/common/utils/environment";
import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from "@nestjs/swagger";
import { Logger } from "nestjs-pino";

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
  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const configService: AppConfigService = app.get(AppConfigService);

  // Conditionally set up Swagger docs in non-production environments.
  if (configService.environment !== Environment.PRODUCTION) {
    const config: Omit<OpenAPIObject, "paths"> = new DocumentBuilder()
      .setTitle("Multi-party computation controller API")
      .setDescription("API for key generation and threshold signing.")
      .setVersion(String(process.env.npm_package_version ?? 1))
      .addBearerAuth()
      .build();

    SwaggerModule.setup("api", app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(configService.port);
};

bootstrap().catch((error: unknown) => {
  console.error("Failed to bootstrap application:", error);
  process.exit(1);
});
