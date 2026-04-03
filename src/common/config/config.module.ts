import { AppConfigService } from "@/common/config/config.service";
import { validate } from "@/common/config/config.validation";
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

/**
 * Global configuration module. Loaded once at startup; its providers
 * (`AppConfigService`) are available everywhere without needing to re-import
 * this module.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [
        ".env.local",
        ".env.development",
        ".env.production",
        ".env",
      ],
      validate,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
class AppConfigModule {}

export { AppConfigModule };
