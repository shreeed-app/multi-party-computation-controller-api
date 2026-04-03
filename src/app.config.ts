import { z } from "zod";

import { ConfigKeySchema } from "@/common/config/config.keys";
import { Environment } from "@/common/utils/environment";

/**
 * Zod schema that validates and coerces all required environment variables.
 * Validation runs at application startup via the NestJS
 * `ConfigModule.validate` hook. The application will refuse to start if any
 * required variable is missing or invalid.
 */
const AppConfigSchema = z.object({
  [ConfigKeySchema.NODE_ENV]: z.enum(Environment).optional(),

  [ConfigKeySchema.PORT]: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000),

  [ConfigKeySchema.CLIENT_BEARER_TOKEN]: z.string().min(1),

  [ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_HOST]: z.string().min(1),

  [ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_PORT]: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535),

  [ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN]: z.string().min(1),

  [ConfigKeySchema.REDIS_HOST]: z.string().min(1),

  [ConfigKeySchema.REDIS_PORT]: z.coerce.number().int().min(1).max(65535),
});

/** TypeScript type inferred from the validated configuration schema. */
type AppConfig = z.infer<typeof AppConfigSchema>;

export { AppConfigSchema, type AppConfig };
