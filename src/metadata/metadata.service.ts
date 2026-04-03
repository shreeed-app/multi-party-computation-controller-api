import { AppConfigService } from "@/common/config/config.service";
import { type Metadata } from "@/metadata/metadata.types";
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { ResultAsync } from "neverthrow";

/**
 * Redis key prefix used to namespace metadata entries. Prevents collisions
 * with BullMQ keys that share the same Redis instance.
 */
const METADATA_REDIS_PREFIX = "metadata" as const;

/**
 * Time-to-live for metadata entries in Redis, in seconds. Set to 30 days; long
 * enough to cover typical key life cycles while preventing unbounded growth
 * for abandoned keys.
 */
const METADATA_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days.

/**
 * Persistence service for key metadata.
 *
 * After a successful `GenerateKey` gRPC call, the worker stores the
 * `publicKeyPackage`, `algorithm`, `threshold`, and `participants` values
 * here, indexed by `keyIdentifier`. The signing processor retrieves these
 * values to reconstruct the exact parameters required by the engine.
 *
 * Storage backend: Redis (same instance as BullMQ, separate key namespace).
 */
@Injectable()
class MetadataService implements OnModuleDestroy {
  private readonly logger = new Logger(MetadataService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: AppConfigService) {
    this.redis = new Redis({
      host: this.configService.redisHost,
      port: this.configService.redisPort,
      family: 4,
      // Required by ioredis when used alongside BullMQ to avoid blocking
      // command queues during failover or reconnect.
      maxRetriesPerRequest: null,
      lazyConnect: false,
    });
    // Prevent unhandled error events from crashing the process.
    this.redis.on("error", (error: Error) => {
      this.logger.error("Redis connection error", error.message);
    });
  }

  /**
   * Persists key metadata in Redis under `metadata:{keyIdentifier}`.
   *
   * Overwrites any existing entry for the same identifier (re-key generation
   * scenario). The TTL is reset on each write.
   *
   * @param {string} keyIdentifier - Application-assigned stable key
   *   identifier.
   * @param {Metadata} metadata - Metadata produced by the key-generation
   *   processor.
   * @returns {Promise<void>}
   */
  async store(keyIdentifier: string, metadata: Metadata): Promise<void> {
    const redisKey: string = `${METADATA_REDIS_PREFIX}:${keyIdentifier}`;
    await this.redis.set(
      redisKey,
      JSON.stringify(metadata),
      "EX",
      METADATA_TTL_SECONDS,
    );
  }

  /**
   * Retrieves key metadata by identifier.
   *
   * @param {string} keyIdentifier - Application-assigned stable key
   *   identifier.
   * @returns {ResultAsync<Metadata | null, Error>} The stored `Metadata`, or
   *   `null` if not found or expired. Errors when the stored value cannot be
   *   parsed (corrupted entry).
   */
  retrieve(keyIdentifier: string): ResultAsync<Metadata | null, Error> {
    const redisKey: string = `${METADATA_REDIS_PREFIX}:${keyIdentifier}`;
    return ResultAsync.fromPromise(
      this.redis.get(redisKey).then((serialized) => {
        if (!serialized) return null;
        return JSON.parse(serialized) as Metadata;
      }),
      (cause) => {
        this.logger.error(
          `Corrupted metadata for key identifier '${keyIdentifier}' — value cannot be parsed as JSON`,
        );
        return new Error(
          `Corrupted metadata for '${keyIdentifier}'. ` +
            `Delete and re-run key generation.`,
          { cause },
        );
      },
    );
  }

  /**
   * Closes the Redis connection gracefully when the NestJS module is torn
   * down. Ensures in-flight commands are flushed before the connection is
   * released.
   *
   * @returns {Promise<void>}
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

export { MetadataService };
