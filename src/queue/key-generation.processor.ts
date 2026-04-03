import { GrpcService } from "@/grpc/grpc.service";
import { GenerateKeyResponse } from "@/grpc/grpc.types";
import { MetadataService } from "@/metadata/metadata.service";
import { JobTimeout, QueueName } from "@/queue/queue.constants";
import {
  type KeyGenerationJobData,
  type KeyGenerationJobResult,
} from "@/queue/queue.types";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { type Job } from "bullmq";
import { Result } from "neverthrow";

/**
 * BullMQ processor for the `key-generation` queue.
 *
 * Dequeues key-generation jobs, calls the cryptographic engine `GenerateKey`
 * RPC, and — critically — persists the returned `publicKeyPackage` to the
 * key-metadata store before marking the job as completed.
 *
 * **Persistence guarantee**: the `publicKeyPackage` is stored atomically in
 * the key-metadata store as part of this method. If this method throws
 * (including after a successful gRPC response), BullMQ marks the job as failed
 * and the caller can retry via a new job. There is no partial-resume mechanism
 * in the engine; a retry must run the full key-generation protocol again.
 *
 * **No automatic retry**: `attempts` is set to 1 in the producer because a
 * failed or aborted session cannot be resumed — each attempt must start a
 * fresh protocol run.
 */
@Injectable()
@Processor(QueueName.KEY_GENERATION, {
  lockDuration: JobTimeout.KEY_GENERATION,
})
class KeyGenerationProcessor extends WorkerHost {
  constructor(
    private readonly grpcService: GrpcService,
    private readonly metadataService: MetadataService,
  ) {
    super();
  }

  /**
   * Executes the key-generation job by running the distributed key-generation
   * protocol via the cryptographic engine.
   *
   * @param {Job<KeyGenerationJobData>} job - BullMQ job carrying a
   *   {@link KeyGenerationJobData} payload.
   * @returns {Promise<KeyGenerationJobResult>} The hex public key and base64
   *   public-key package on success.
   * @throws {Error} Wrapping the gRPC error details on engine failure.
   */
  async process(
    job: Job<KeyGenerationJobData>,
  ): Promise<KeyGenerationJobResult> {
    const result: Result<GenerateKeyResponse, Error> =
      await this.grpcService.generateKey({
        keyIdentifier: job.data.keyIdentifier,
        algorithm: job.data.algorithm,
        threshold: job.data.threshold,
        participants: job.data.participants,
      });

    if (result.isErr()) throw result.error;
    const publicKey: string = Buffer.from(result.value.publicKey).toString(
      "hex",
    );
    const publicKeyPackage: string = Buffer.from(
      result.value.publicKeyPackage,
    ).toString("base64");

    // Persist key metadata immediately so the signing processor can retrieve
    // publicKeyPackage without relying on client-side storage.
    await this.metadataService.store(job.data.keyIdentifier, {
      algorithm: job.data.algorithm,
      threshold: job.data.threshold,
      participants: job.data.participants,
      publicKeyPackage,
      publicKey,
      storedAt: new Date().toISOString(),
    });

    return { publicKey, publicKeyPackage };
  }
}

export { KeyGenerationProcessor };
