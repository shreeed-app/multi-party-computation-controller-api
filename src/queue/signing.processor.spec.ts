import { NotFoundException } from "@nestjs/common";
import { type Job } from "bullmq";
import { errAsync, okAsync } from "neverthrow";

import { Message } from "@/common/constants/message";
import { GrpcService } from "@/grpc/grpc.service";
import { Algorithm } from "@/grpc/grpc.types";
import { MetadataService } from "@/metadata/metadata.service";
import { type Metadata } from "@/metadata/metadata.types";
import { SigningJobResult, type SigningJobData } from "@/queue/queue.types";
import { SigningProcessor } from "@/queue/signing.processor";

// Stored key metadata as it would exist after a successful key-generation job.
const KEY_METADATA: Metadata = {
  algorithm: Algorithm.FROST_ED25519,
  threshold: 2,
  participants: 3,
  publicKeyPackage: Buffer.alloc(64, 0xcd).toString("base64"),
  publicKey: Buffer.alloc(32, 0xab).toString("hex"),
  storedAt: new Date().toDateString(),
};

// Signing job payload referencing the key stored above.
const JOB_DATA: SigningJobData = {
  keyIdentifier: "1",
  message: "abcdef",
};

/**
 * Minimal Job stub — only `data` is accessed by the processor.
 *
 * @param {SigningJobData} data - The job payload to return from the stub.
 * @returns {Job<SigningJobData>} A Job object with the specified data.
 */
const makeJob = (data: SigningJobData): Job<SigningJobData> => {
  return { data } as unknown as Job<SigningJobData>;
};

describe("SigningProcessor", () => {
  let processor: SigningProcessor;
  let grpcService: jest.Mocked<GrpcService>;
  let metadataService: jest.Mocked<MetadataService>;

  beforeEach(() => {
    // Provide only the methods the processor actually calls so the mock stays
    // minimal and tests fail loudly if unexpected methods are invoked.
    grpcService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<GrpcService>;

    metadataService = {
      retrieve: jest.fn(),
    } as unknown as jest.Mocked<MetadataService>;

    // WorkerHost has a no-op constructor, safe to instantiate directly.
    processor = new SigningProcessor(grpcService, metadataService);
  });

  it("Throws NotFoundException when key metadata is absent.", async () => {
    // The signing processor cannot proceed without the publicKeyPackage and
    // algorithm stored during key generation — fail fast with a clear error.
    metadataService.retrieve.mockResolvedValue(null);

    await expect(processor.process(makeJob(JOB_DATA))).rejects.toThrow(
      NotFoundException,
    );
  });

  it("Calls sign with the correct gRPC request payload.", async () => {
    // The processor must decode the stored base64 publicKeyPackage back to a
    // Buffer, and the hex message back to a Buffer, before forwarding to gRPC.
    metadataService.retrieve.mockResolvedValue(KEY_METADATA);
    grpcService.sign.mockReturnValue(
      okAsync({ result: { raw: Buffer.alloc(64, 0xff) } }),
    );

    await processor.process(makeJob(JOB_DATA));

    expect(grpcService.sign).toHaveBeenCalledWith({
      keyIdentifier: JOB_DATA.keyIdentifier,
      publicKeyPackage: Buffer.from(KEY_METADATA.publicKeyPackage, "base64"),
      algorithm: KEY_METADATA.algorithm,
      threshold: KEY_METADATA.threshold,
      participants: KEY_METADATA.participants,
      message: Buffer.from(JOB_DATA.message, "hex"),
    });
  });

  describe("mapSignatureResult", () => {
    it("Returns a hex signature and null recoveryId for a FROST raw buffer.", async () => {
      // FROST algorithms (Ed25519, Schnorr) return a single 64-byte raw buffer
      // with no recovery id.
      const rawBytes: Buffer = Buffer.alloc(64, 0xff);
      metadataService.retrieve.mockResolvedValue(KEY_METADATA);
      grpcService.sign.mockReturnValue(okAsync({ result: { raw: rawBytes } }));

      const result: SigningJobResult = await processor.process(
        makeJob(JOB_DATA),
      );

      expect(result.signature).toBe(rawBytes.toString("hex"));
      expect(result.recoveryId).toBeNull();
    });

    it("Returns r ‖ s hex and recoveryId for a CGGMP24 ecdsa result.", async () => {
      // ECDSA results carry separate r and s components plus a recovery id v
      // (0–3); the processor must concatenate r‖s into a single hex string.
      const r: Buffer = Buffer.alloc(32, 0x11);
      const s: Buffer = Buffer.alloc(32, 0x22);
      metadataService.retrieve.mockResolvedValue(KEY_METADATA);
      grpcService.sign.mockReturnValue(
        okAsync({ result: { ecdsa: { r, s, v: 1 } } }),
      );

      const result: SigningJobResult = await processor.process(
        makeJob(JOB_DATA),
      );

      expect(result.signature).toBe(Buffer.concat([r, s]).toString("hex"));
      expect(result.recoveryId).toBe(1);
    });

    it("Throws when the engine returns an empty signature result.", async () => {
      // An empty result object (neither `raw` nor `ecdsa`) indicates a bug in
      // the engine protocol; surface it as an explicit error rather than
      // silently returning an undefined signature.
      metadataService.retrieve.mockResolvedValue(KEY_METADATA);
      grpcService.sign.mockReturnValue(okAsync({ result: {} }));

      await expect(processor.process(makeJob(JOB_DATA))).rejects.toThrow(
        Message.EMPTY_SIGNATURE_RESULT,
      );
    });
  });

  it("Re-throws a formatted gRPC error on engine failure.", async () => {
    const message: string = "Unavailable.";
    // GrpcService wraps the engine error via formatGrpcError before returning
    // errAsync; the processor re-throws result.error as-is.
    metadataService.retrieve.mockResolvedValue(KEY_METADATA);
    grpcService.sign.mockReturnValue(
      errAsync(new Error(Message.ENGINE_ERROR(14, message))),
    );

    await expect(processor.process(makeJob(JOB_DATA))).rejects.toThrow(
      Message.ENGINE_ERROR(14, message),
    );
  });
});
