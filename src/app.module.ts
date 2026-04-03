import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { AppConfigModule } from "@/common/config/config.module";
import { AppConfigService } from "@/common/config/config.service";
import { GrpcModule } from "@/grpc/grpc.module";
import { JobsModule } from "@/jobs/jobs.module";
import { MetadataModule } from "@/metadata/metadata.module";
import { KeyGenerationModule } from "@/tasks/key-generation/key-generation.module";
import { SigningModule } from "@/tasks/signing/signing.module";

/**
 * Root application module.
 *
 * Module loading order:
 *
 * 1. `AppConfigModule` — global config and env validation (must be first).
 * 2. `BullModule.forRootAsync` — sets up the shared BullMQ Redis connection.
 * 3. `GrpcModule` — global gRPC client for the Rust controller engine.
 * 4. `MetadataModule` — global metadata Redis store.
 * 5. Feature modules (`KeyGenerationModule`, `SigningModule`, `JobsModule`).
 */
@Module({
  imports: [
    AppConfigModule,

    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        connection: {
          host: configService.redisHost,
          port: configService.redisPort,
          family: 4,
        },
      }),
    }),

    GrpcModule,
    MetadataModule,

    KeyGenerationModule,
    SigningModule,
    JobsModule,
  ],
})
class AppModule {}

export { AppModule };
