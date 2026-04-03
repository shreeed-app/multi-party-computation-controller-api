import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type AppConfig } from "@/app.config";
import { ConfigKeySchema } from "@/common/config/config.keys";

/**
 * Typed wrapper around NestJS `ConfigService` that exposes individual
 * configuration values as strongly-typed properties.
 *
 * Injecting `AppConfigService` instead of the raw `ConfigService` prevents
 * scattered `config.get('SOME_KEY')` calls and avoids runtime type surprises.
 */
@Injectable()
class AppConfigService {
  constructor(private readonly config: ConfigService<AppConfig>) {}

  /**
   * Retrieves a required string config value, throwing if missing.
   */
  private getRequiredString(key: string): string {
    const value: string | undefined = this.config.get<string>(key, {
      infer: true,
    });
    if (value === undefined || value === null) {
      throw new Error(`Required config key "${key}" is not set.`);
    }
    return value;
  }

  /**
   * Retrieves a required number config value, throwing if missing.
   */
  private getRequiredNumber(key: string): number {
    const value: number | undefined = this.config.get<number>(key, {
      infer: true,
    });
    if (value === undefined || value === null) {
      throw new Error(`Required config key "${key}" is not set.`);
    }
    return value;
  }

  /**
   * TCP port on which the HTTP server listens.
   *
   * @returns The configured port number; defaults to 3000.
   */
  public get port(): number {
    return (
      this.config.get<number>(ConfigKeySchema.PORT, { infer: true }) ?? 3000
    );
  }

  /**
   * Bearer token that client backends must present in the `Authorization`
   * header.
   *
   * @returns The configured client bearer token.
   */
  public get clientBearerToken(): string {
    return this.getRequiredString(ConfigKeySchema.CLIENT_BEARER_TOKEN);
  }

  /**
   * Hostname or IP address of the Rust controller engine gRPC server.
   *
   * @returns The engine host string.
   */
  public get rustEngineHost(): string {
    return this.getRequiredString(
      ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_HOST,
    );
  }

  /**
   * Port of the Rust controller engine gRPC server.
   *
   * @returns The engine port number.
   */
  public get rustEnginePort(): number {
    return this.getRequiredNumber(
      ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_PORT,
    );
  }

  /**
   * Bearer token injected into gRPC metadata for every call to the Rust
   * engine.
   *
   * @returns The engine bearer token.
   */
  public get rustEngineBearerToken(): string {
    return this.getRequiredString(
      ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN,
    );
  }

  /**
   * Hostname or IP address of the Redis instance.
   *
   * @returns The Redis host string.
   */
  public get redisHost(): string {
    return this.getRequiredString(ConfigKeySchema.REDIS_HOST);
  }

  /**
   * Port of the Redis instance.
   *
   * @returns The Redis port number.
   */
  public get redisPort(): number {
    return this.getRequiredNumber(ConfigKeySchema.REDIS_PORT);
  }
}

export { AppConfigService };
