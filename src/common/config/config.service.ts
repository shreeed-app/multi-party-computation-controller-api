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
    return this.config.get<string>(ConfigKeySchema.CLIENT_BEARER_TOKEN, {
      infer: true,
    })!;
  }

  /**
   * Hostname or IP address of the Rust controller engine gRPC server.
   *
   * @returns The engine host string.
   */
  public get rustEngineHost(): string {
    return this.config.get<string>(ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_HOST, {
      infer: true,
    })!;
  }

  /**
   * Port of the Rust controller engine gRPC server.
   *
   * @returns The engine port number.
   */
  public get rustEnginePort(): number {
    return this.config.get<number>(ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_PORT, {
      infer: true,
    })!;
  }

  /**
   * Bearer token injected into gRPC metadata for every call to the Rust
   * engine.
   *
   * @returns The engine bearer token.
   */
  public get rustEngineBearerToken(): string {
    return this.config.get<string>(
      ConfigKeySchema.CRYPTOGRAPHIC_ENGINE_BEARER_TOKEN,
      {
        infer: true,
      },
    )!;
  }

  /**
   * Hostname or IP address of the Redis instance.
   *
   * @returns The Redis host string.
   */
  public get redisHost(): string {
    return this.config.get<string>(ConfigKeySchema.REDIS_HOST, {
      infer: true,
    })!;
  }

  /**
   * Port of the Redis instance.
   *
   * @returns The Redis port number.
   */
  public get redisPort(): number {
    return this.config.get<number>(ConfigKeySchema.REDIS_PORT, {
      infer: true,
    })!;
  }
}

export { AppConfigService };
