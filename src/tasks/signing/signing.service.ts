import { JobAttempts, QueueName } from "@/queue/queue.constants";
import { type SigningJobData } from "@/queue/queue.types";
import {
  type SigningRequestDto,
  type SigningResponseDto,
} from "@/tasks/signing/signing.dto";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { type Queue } from "bullmq";
import { randomUUID } from "crypto";

/**
 * Service responsible for enqueuing signing jobs into the BullMQ `signing`
 * queue.
 *
 * Like `KeyGenerationService`, this is a thin adapter: it translates the
 * validated HTTP DTO into a job payload and returns the job identifier
 * immediately.
 */
@Injectable()
class SigningService {
  constructor(
    @InjectQueue(QueueName.SIGNING)
    private readonly signingQueue: Queue<SigningJobData>,
  ) {}

  /**
   * Enqueues a new signing job and returns the job identifier immediately.
   *
   * Automatic retries are disabled ({@link JobAttempts.SINGLE}) to match the
   * engine's stateless protocol — a failed signing session cannot be resumed.
   * Job-level timeouts are controlled at the Worker level via `lockDuration`
   * (BullMQ v5 removed per-job `timeout`).
   *
   * @param {SigningRequestDto} dto - Validated signing request data from the
   *   HTTP layer.
   * @returns {Promise<SigningResponseDto>} A DTO containing the opaque job
   *   identifier for status polling.
   */
  async enqueue(dto: SigningRequestDto): Promise<SigningResponseDto> {
    const jobId: string = randomUUID();

    await this.signingQueue.add(
      QueueName.SIGNING,
      {
        keyIdentifier: dto.keyIdentifier,
        message: dto.message,
      },
      {
        jobId,
        attempts: JobAttempts.SINGLE,
      },
    );

    return { jobId };
  }
}

export { SigningService };
