import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ConfigKeySchema } from "@/common/config/config.keys";
import { AppConfigService } from "@/common/config/config.service";
import { validate } from "@/common/config/config.validation";
import { Mode } from "@/common/constants/mode";
import { loadNodesConfig } from "@/services/node/node.loader";

const mode: Mode | undefined = process.env[
  ConfigKeySchema.APPLICATION_MODE
] as Mode | undefined;

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
      validate: validate,
      load: mode === Mode.Bootstrap ? [loadNodesConfig] : [],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
class AppConfigModule {}

export { AppConfigModule };
