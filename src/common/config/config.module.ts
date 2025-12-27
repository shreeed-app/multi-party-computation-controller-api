import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import z, { type ZodSafeParseResult } from "zod";

import { type AppConfig, AppConfigSchema } from "@/app.config";
import { ConfigKeySchema } from "@/common/config/config.keys";
import { AppConfigService } from "@/common/config/config.service";
import { Mode } from "@/common/constants/mode";
import { loadNodesConfig } from "@/services/node/node.loader";

/**
 * Validate and parse the environment variables using Zod schema.
 *
 * @param {Record<string, unknown>} env The environment variables to validate.
 * @returns The validated and parsed application configuration.
 * @throws Will throw an error if validation fails.
 */
const validate = (env: Record<string, unknown>): AppConfig => {
  const parsed: ZodSafeParseResult<AppConfig> = AppConfigSchema.safeParse(env);
  if (parsed.success) return parsed.data;
  throw new Error(z.treeifyError(parsed.error).errors.join("\n"));
};

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
