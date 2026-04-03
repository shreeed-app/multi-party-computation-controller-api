import { type AppConfig, AppConfigSchema } from "@/app.config";
import { type ZodSafeParseResult } from "zod";

/**
 * Mock the config validation so the app can bootstrap in the e2e test
 * environment without requiring all production env vars to be present. Tests
 * that exercise specific behavior should set the relevant variables themselves
 * or mock the services they depend on.
 */
jest.mock("@/common/config/config.validation", () => ({
  validate: jest.fn((env: Record<string, unknown>): AppConfig => {
    const result: ZodSafeParseResult<AppConfig> =
      AppConfigSchema.safeParse(env);
    if (result.success) return result.data;

    // Return a minimal valid config for tests that don't set env vars.
    return {
      PORT: 3000,
      CLIENT_BEARER_TOKEN: "client-token",
      CRYPTOGRAPHIC_ENGINE_HOST: "localhost",
      CRYPTOGRAPHIC_ENGINE_PORT: 50051,
      CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN: "cryptographic-token",
      REDIS_HOST: "localhost",
      REDIS_PORT: 6379,
    } as AppConfig;
  }),
}));
