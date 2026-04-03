/**
 * Exhaustive map of environment variable names consumed by the application.
 * Using this object instead of raw strings prevents typos and enables IDE
 * auto-completion across the codebase.
 */
const ConfigKeySchema = {
  /** Node.js runtime environment (`production` | `development` | `test`). */
  NODE_ENV: "NODE_ENV",

  /** TCP port on which the HTTP server listens. Defaults to 3000. */
  PORT: "PORT",

  /** Bearer token that client backends must send in Authorization header. */
  CLIENT_BEARER_TOKEN: "CLIENT_BEARER_TOKEN",

  /** Hostname or IP address of the Rust controller engine gRPC server. */
  CRYPTOGRAPHIC_ENGINE_HOST: "CRYPTOGRAPHIC_ENGINE_HOST",

  /** Port of the Rust controller engine gRPC server. */
  CRYPTOGRAPHIC_ENGINE_PORT: "CRYPTOGRAPHIC_ENGINE_PORT",

  /** Bearer token sent to the Rust controller engine via gRPC metadata. */
  CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN: "CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN",

  /**
   * Hostname or IP address of the Redis instance used by BullMQ and
   * key-metadata storage.
   */
  REDIS_HOST: "REDIS_HOST",

  /** Port of the Redis instance. */
  REDIS_PORT: "REDIS_PORT",
} as const;

/** Union of all valid environment variable name strings. */
type ConfigKey = (typeof ConfigKeySchema)[keyof typeof ConfigKeySchema];

export { ConfigKeySchema, type ConfigKey };
