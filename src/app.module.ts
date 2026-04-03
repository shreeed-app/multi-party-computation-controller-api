import { AppConfigModule } from "@/common/config/config.module";
import { AppConfigService } from "@/common/config/config.service";
import { LogLevel } from "@/common/constants/log-level";
import { IpBearerThrottlerGuard } from "@/common/throttler/throttler.guard";
import { Environment } from "@/common/utils/environment";
import { GrpcModule } from "@/grpc/grpc.module";
import { JobsModule } from "@/jobs/jobs.module";
import { MetadataModule } from "@/metadata/metadata.module";
import { KeyGenerationModule } from "@/tasks/key-generation/key-generation.module";
import { SigningModule } from "@/tasks/signing/signing.module";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule, type Params } from "nestjs-pino";
import { type TransportTargetOptions } from "pino";

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
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService): Params => {
        const isDevelopment: boolean =
          configService.environment !== Environment.PRODUCTION;

        const targets: TransportTargetOptions[] = [
          {
            target: "pino-roll",
            options: {
              file: `${configService.logDirectory}/app`,
              frequency: "daily",
              dateFormat: "yyyy-MM-dd",
              mkdir: true,
            },
            level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
          },
        ];

        if (isDevelopment) {
          targets.push({
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:standard" },
            level: LogLevel.DEBUG,
          });
        }

        return {
          pinoHttp: {
            level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
            transport: { targets },
            autoLogging: false,
          },
        };
      },
    }),
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: IpBearerThrottlerGuard,
    },
  ],
})
class AppModule {}

export { AppModule };
