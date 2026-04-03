import z, { type ZodSafeParseResult } from "zod";

import { type AppConfig, AppConfigSchema } from "@/app.config";

/**
 * Validates and coerces the raw process environment against `AppConfigSchema`.
 * Called by NestJS `ConfigModule.forRoot({ validate })` at application
 * startup.
 *
 * @param {Record<string, unknown>} env - Raw key/value map from `process.env`.
 * @returns {AppConfig} The validated and type-coerced application
 *   configuration.
 * @throws {Error} If validation fails; the error message lists all invalid
 *   fields.
 */
const validate = (env: Record<string, unknown>): AppConfig => {
  const parsed: ZodSafeParseResult<AppConfig> = AppConfigSchema.safeParse(env);
  if (parsed.success) return parsed.data;
  throw new Error(z.treeifyError(parsed.error).errors.join("\n"));
};

export { validate };
