import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

import { AppConfigService } from "@/common/config/config.service";
import { type KeyMetadata } from "@/key-metadata/key-metadata.types";

/**
 * Redis key prefix used to namespace key-metadata entries. Prevents collisions
 * with BullMQ keys that share the same Redis instance.
 */
const KEY_METADATA_REDIS_PREFIX = "key-metadata" as const;

/**
 * Time-to-live for key-metadata entries in Redis, in seconds. Set to 30 days;
 * long enough to cover typical key life cycles while preventing unbounded
 * growth for abandoned keys.
 */
const KEY_METADATA_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days.

/**
 * Persistence service for MPC key metadata.
 *
 * After a successful `GenerateKey` gRPC call, the worker stores the
 * `publicKeyPackage`, `algorithm`, `threshold`, and `participants` values
 * here, indexed by `keyIdentifier`. The signing processor retrieves these
 * values to reconstruct the exact parameters required by the engine.
 *
 * Storage backend: Redis (same instance as BullMQ, separate key namespace).
 */
@Injectable()
class KeyMetadataService implements OnModuleDestroy {
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
  }

  /**
   * Persists key metadata in Redis under `key-metadata:{keyIdentifier}`.
   *
   * Overwrites any existing entry for the same identifier (re-keygen
   * scenario). The TTL is reset on each write.
   *
   * @param {string} keyIdentifier - Application-assigned stable key
   *   identifier.
   * @param {KeyMetadata} metadata - Metadata produced by the key-generation
   *   processor.
   * @returns {Promise<void>}
   */
  async store(keyIdentifier: string, metadata: KeyMetadata): Promise<void> {
    const redisKey: string = `${KEY_METADATA_REDIS_PREFIX}:${keyIdentifier}`;
    await this.redis.set(
      redisKey,
      JSON.stringify(metadata),
      "EX",
      KEY_METADATA_TTL_SECONDS,
    );
  }

  /**
   * Retrieves key metadata by identifier.
   *
   * @param {string} keyIdentifier - Application-assigned stable key
   *   identifier.
   * @returns {Promise<KeyMetadata | null>} The stored `KeyMetadata`, or `null`
   *   if not found or expired.
   */
  async retrieve(keyIdentifier: string): Promise<KeyMetadata | null> {
    const redisKey: string = `${KEY_METADATA_REDIS_PREFIX}:${keyIdentifier}`;
    const serialized: string | null = await this.redis.get(redisKey);
    if (!serialized) return null;
    return JSON.parse(serialized) as KeyMetadata;
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

export { KeyMetadataService };
