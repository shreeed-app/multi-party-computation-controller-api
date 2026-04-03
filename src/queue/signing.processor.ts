import { Message } from "@/common/constants/message";
import { GrpcService } from "@/grpc/grpc.service";
import { type SignResponse } from "@/grpc/grpc.types";
import { MetadataService } from "@/metadata/metadata.service";
import { Metadata } from "@/metadata/metadata.types";
import { JobTimeout, QueueName } from "@/queue/queue.constants";
import {
  type SigningJobData,
  type SigningJobResult,
} from "@/queue/queue.types";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { type Job } from "bullmq";
import { type Result } from "neverthrow";

/**
 * BullMQ processor for the `signing` queue.
 *
 * Dequeues signing jobs, retrieves the stored key metadata for the requested
 * `keyIdentifier`, and delegates the threshold-signature protocol to the
 * cryptographic engine via the `Sign` gRPC RPC.
 *
 * **Key metadata dependency**: this processor expects that a successful
 * `KeyGenerationProcessor` run has already stored the `publicKeyPackage`,
 * `algorithm`, `threshold`, and `participants` for the given `keyIdentifier`.
 * If the metadata is absent, the job fails immediately with a descriptive
 * error.
 *
 * **No automatic retry**: matching the key-generation processor, `attempts` is
 * set to 1 at the producer level.
 */
@Injectable()
@Processor(QueueName.SIGNING, { lockDuration: JobTimeout.SIGNING })
class SigningProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(SigningProcessor.name);

  constructor(
    private readonly grpcService: GrpcService,
    private readonly metadataService: MetadataService,
  ) {
    super();
  }

  /**
   * Executes the signing job by running the threshold-signature protocol via
   * the cryptographic engine.
   *
   * @param {Job<SigningJobData>} job - BullMQ job carrying a
   *   {@link SigningJobData} payload.
   * @returns {Promise<SigningJobResult>} The hex-encoded signature and, for
   *   CGGMP24, the recovery id.
   * @throws {NotFoundException} When no key metadata exists for
   *   `keyIdentifier`.
   * @throws {Error} Wrapping gRPC error details on engine failure.
   */
  async process(job: Job<SigningJobData>): Promise<SigningJobResult> {
    const metadataResult: Result<Metadata | null, Error> =
      await this.metadataService.retrieve(job.data.keyIdentifier);

    if (metadataResult.isErr()) {
      this.logger.error(
        `Failed to retrieve key metadata for job ${job.id}:` +
          `${metadataResult.error.message}`,
      );
      throw metadataResult.error;
    }

    if (!metadataResult.value) {
      this.logger.error(
        `Key metadata not found for job ${job.id} — run key generation first.`,
      );
      throw new NotFoundException(
        Message.KEY_METADATA_NOT_FOUND(job.data.keyIdentifier),
      );
    }

    const result: Result<SignResponse, Error> = await this.grpcService.sign({
      keyIdentifier: job.data.keyIdentifier,
      publicKeyPackage: Buffer.from(
        metadataResult.value.publicKeyPackage,
        "base64",
      ),
      algorithm: metadataResult.value.algorithm,
      threshold: metadataResult.value.threshold,
      participants: metadataResult.value.participants,
      message: Buffer.from(job.data.message, "hex"),
    });

    if (result.isErr()) {
      this.logger.error(
        `gRPC Sign failed for job ${job.id}: ${result.error.message}`,
      );
      throw result.error;
    }
    return mapSignatureResult(result.value);
  }
}

/**
 * Maps the gRPC `SignResponse` to the job result shape.
 *
 * - FROST algorithms return a 64-byte `raw` buffer (r ‖ s).
 * - CGGMP24 returns an `ecdsa` struct with r, s (32 bytes each) and v.
 *
 * @param {SignResponse} response - The response received from the engine.
 * @returns {SigningJobResult} A {@link SigningJobResult} with a hex signature
 *   and optional recovery id.
 * @throws {Error} If the engine returns an empty signature result.
 */
const mapSignatureResult = (response: SignResponse): SigningJobResult => {
  if (response.result.raw) {
    return {
      signature: Buffer.from(response.result.raw).toString("hex"),
      recoveryId: null,
    };
  }

  if (response.result.ecdsa) {
    return {
      signature: Buffer.concat([
        Buffer.from(response.result.ecdsa.r),
        Buffer.from(response.result.ecdsa.s),
      ]).toString("hex"),
      recoveryId: response.result.ecdsa.v,
    };
  }

  throw new Error(Message.EMPTY_SIGNATURE_RESULT);
};

export { SigningProcessor };
