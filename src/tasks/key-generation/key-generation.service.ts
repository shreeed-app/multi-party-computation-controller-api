import { randomUUID } from "crypto";

import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { type Queue } from "bullmq";

import { JobAttempts, QueueName } from "@/queue/queue.constants";
import { type KeyGenerationJobData } from "@/queue/queue.types";
import {
  type KeyGenerationRequestDto,
  type KeyGenerationResponseDto,
} from "@/tasks/key-generation/key-generation.dto";

/**
 * Service responsible for enqueuing key-generation jobs into the BullMQ
 * `key-generation` queue.
 *
 * This service does not perform any cryptography; it acts as a thin adapter
 * that translates the HTTP request DTO into a BullMQ job payload and returns
 * the generated job identifier to the caller.
 */
@Injectable()
class KeyGenerationService {
  constructor(
    @InjectQueue(QueueName.KEY_GENERATION)
    private readonly keyGenerationQueue: Queue<KeyGenerationJobData>,
  ) {}

  /**
   * Enqueues a new key-generation job and returns the job identifier
   * immediately.
   *
   * Automatic retries are disabled ({@link JobAttempts.SINGLE}) because the
   * engine does not support resuming a partial key-generation session; any
   * failure requires a fresh run. Job-level timeouts are controlled at the
   * Worker level via `lockDuration` (BullMQ v5 removed per-job `timeout`).
   *
   * @param {KeyGenerationRequestDto} dto - Validated key-generation request
   *   data from the HTTP layer.
   * @returns {Promise<KeyGenerationResponseDto>} A DTO containing the opaque
   *   job identifier for status polling.
   */
  async enqueue(
    dto: KeyGenerationRequestDto,
  ): Promise<KeyGenerationResponseDto> {
    const jobId: string = randomUUID();

    await this.keyGenerationQueue.add(
      QueueName.KEY_GENERATION,
      {
        keyIdentifier: dto.keyIdentifier,
        algorithm: dto.algorithm,
        threshold: dto.threshold,
        participants: dto.participants,
      },
      {
        jobId,
        attempts: JobAttempts.SINGLE,
      },
    );

    return { jobId };
  }
}

export { KeyGenerationService };
