import z, { type ZodSafeParseResult } from "zod";

import { type AppConfig, AppConfigSchema } from "@/app.config";

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

export default validate;
export { validate };
