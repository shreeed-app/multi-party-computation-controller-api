import type { AppConfig } from "@/app.config";
import { validate } from "@/common/config/config.validation";

// Mapped type to express all env vars as raw strings before Zod coercion.
// This mirrors how process.env supplies values at startup.
type StringifiedAppConfig = {
  [K in keyof AppConfig]: string;
};

// A complete, valid environment used as the baseline. Individual tests spread
// this and override only the field under test.
const VALID_ENV: StringifiedAppConfig = {
  PORT: "3000",
  CLIENT_BEARER_TOKEN: "client-token",
  CRYPTOGRAPHIC_ENGINE_HOST: "localhost",
  CRYPTOGRAPHIC_ENGINE_PORT: "50051",
  CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN: "cryptographic-token",
  REDIS_HOST: "localhost",
  REDIS_PORT: "6379",
};

describe("Validate (AppConfigSchema)", () => {
  it("Parses a valid environment and coerces string ports to numbers.", () => {
    // All coerce() fields must be converted to numbers; string fields pass
    // through unchanged.
    const config: AppConfig = validate(VALID_ENV);

    expect(config).toMatchObject({
      PORT: Number(VALID_ENV.PORT),
      CLIENT_BEARER_TOKEN: VALID_ENV.CLIENT_BEARER_TOKEN,
      CRYPTOGRAPHIC_ENGINE_HOST: VALID_ENV.CRYPTOGRAPHIC_ENGINE_HOST,
      CRYPTOGRAPHIC_ENGINE_PORT: Number(VALID_ENV.CRYPTOGRAPHIC_ENGINE_PORT),
      CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN:
        VALID_ENV.CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN,
      REDIS_HOST: VALID_ENV.REDIS_HOST,
      REDIS_PORT: Number(VALID_ENV.REDIS_PORT),
    });
  });

  it("Accepts an explicit PORT override and coerces it.", () => {
    // PORT has a default of 3000; ensure overrides are coerced correctly.
    const port: number = 8080;
    const config: AppConfig = validate({ ...VALID_ENV, PORT: String(port) });
    expect(config.PORT).toBe(port);
  });

  it("Throws when CLIENT_BEARER_TOKEN is missing.", () => {
    // Required string — absence must fail validation at startup.
    const { CLIENT_BEARER_TOKEN: _, ...env }: StringifiedAppConfig = VALID_ENV;
    expect(() => validate(env)).toThrow();
  });

  it("Throws when CRYPTOGRAPHIC_ENGINE_HOST is missing.", () => {
    // Required string — the gRPC client cannot connect without a host.
    const { CRYPTOGRAPHIC_ENGINE_HOST: _, ...env }: StringifiedAppConfig =
      VALID_ENV;
    expect(() => validate(env)).toThrow();
  });

  it("Throws when REDIS_PORT is out of range.", () => {
    // Port numbers above 65535 are invalid; Zod max(65535) must reject this.
    expect(() => validate({ ...VALID_ENV, REDIS_PORT: "99999" })).toThrow();
  });

  it("Throws when CRYPTOGRAPHIC_ENGINE_PORT is not a number.", () => {
    // Z.coerce.number() will produce NaN for non-numeric strings, which then
    // fails the int() refinement.
    expect(() =>
      validate({ ...VALID_ENV, CRYPTOGRAPHIC_ENGINE_PORT: "_" }),
    ).toThrow();
  });

  it("Throws when PORT is below the valid range.", () => {
    // Port 0 is reserved and explicitly excluded by min(1).
    expect(() => validate({ ...VALID_ENV, PORT: "0" })).toThrow();
  });
});
