import { Message } from "@/common/constants/message";
import { GrpcService } from "@/grpc/grpc.service";
import { Algorithm } from "@/grpc/grpc.types";
import { MetadataService } from "@/metadata/metadata.service";
import { KeyGenerationProcessor } from "@/queue/key-generation.processor";
import {
  type KeyGenerationJobData,
  type KeyGenerationJobResult,
} from "@/queue/queue.types";
import { type Job } from "bullmq";
import { errAsync, okAsync } from "neverthrow";

// Baseline job payload matching a 2-of-3 FROST Ed25519 key-generation.
const JOB_DATA: KeyGenerationJobData = {
  keyIdentifier: "1",
  algorithm: Algorithm.FROST_ED25519,
  threshold: 2,
  participants: 3,
};

// Fixed byte buffers returned by the mock gRPC service. Using alloc()
// produces deterministic values so assertions are exact, not approximate.
const PUBLIC_KEY_BYTES: Buffer = Buffer.alloc(32, 0xab);
const PUBLIC_KEY_PACKAGE_BYTES: Buffer = Buffer.alloc(64, 0xcd);

// Minimal Job stub — only `data` is accessed by the processor.
const makeJob = (data: KeyGenerationJobData): Job<KeyGenerationJobData> => {
  return { data } as unknown as Job<KeyGenerationJobData>;
};

describe("KeyGenerationProcessor", () => {
  let processor: KeyGenerationProcessor;
  let grpcService: jest.Mocked<GrpcService>;
  let metadataService: jest.Mocked<MetadataService>;

  beforeEach(() => {
    // Provide only the methods the processor actually calls so the mock stays
    // minimal and tests fail loudly if unexpected methods are invoked.
    grpcService = {
      generateKey: jest.fn(),
    } as unknown as jest.Mocked<GrpcService>;

    metadataService = {
      store: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<MetadataService>;

    // WorkerHost has a no-op constructor, safe to instantiate directly.
    processor = new KeyGenerationProcessor(grpcService, metadataService);
  });

  it("Calls generateKey with the correct request payload.", async () => {
    // Arrange — mock a successful gRPC response.
    grpcService.generateKey.mockReturnValue(
      okAsync({
        publicKey: PUBLIC_KEY_BYTES,
        publicKeyPackage: PUBLIC_KEY_PACKAGE_BYTES,
      }),
    );

    await processor.process(makeJob(JOB_DATA));

    // Assert — every field from the job data must be forwarded verbatim.
    expect(grpcService.generateKey).toHaveBeenCalledWith({
      keyIdentifier: JOB_DATA.keyIdentifier,
      algorithm: JOB_DATA.algorithm,
      threshold: JOB_DATA.threshold,
      participants: JOB_DATA.participants,
    });
  });

  it("Returns the hex public key and base64 public key package.", async () => {
    grpcService.generateKey.mockReturnValue(
      okAsync({
        publicKey: PUBLIC_KEY_BYTES,
        publicKeyPackage: PUBLIC_KEY_PACKAGE_BYTES,
      }),
    );

    const result: KeyGenerationJobResult = await processor.process(
      makeJob(JOB_DATA),
    );

    // PublicKey must be hex-encoded (used for display / on-chain address
    // derivation); publicKeyPackage must be base64 (opaque binary for Sign).
    expect(result.publicKey).toBe(PUBLIC_KEY_BYTES.toString("hex"));
    expect(result.publicKeyPackage).toBe(
      PUBLIC_KEY_PACKAGE_BYTES.toString("base64"),
    );
  });

  it("Stores key metadata immediately after a successful key generation.", async () => {
    grpcService.generateKey.mockReturnValue(
      okAsync({
        publicKey: PUBLIC_KEY_BYTES,
        publicKeyPackage: PUBLIC_KEY_PACKAGE_BYTES,
      }),
    );

    await processor.process(makeJob(JOB_DATA));

    // The metadata store must be called before the job is marked as completed
    // so that signing jobs queued immediately after can always find the data.
    expect(metadataService.store).toHaveBeenCalledWith(
      JOB_DATA.keyIdentifier,
      expect.objectContaining({
        algorithm: JOB_DATA.algorithm,
        threshold: JOB_DATA.threshold,
        participants: JOB_DATA.participants,
        publicKey: PUBLIC_KEY_BYTES.toString("hex"),
        publicKeyPackage: PUBLIC_KEY_PACKAGE_BYTES.toString("base64"),
      }),
    );
  });

  it("Re-throws the error when the gRPC call fails.", async () => {
    const error = new Error(Message.ENGINE_ERROR(4, "Deadline exceeded."));
    grpcService.generateKey.mockReturnValue(errAsync(error));

    await expect(processor.process(makeJob(JOB_DATA))).rejects.toThrow(
      Message.ENGINE_ERROR(4, "Deadline exceeded."),
    );
  });

  it("Does not store metadata when the gRPC call fails.", async () => {
    // If generateKey returns an error, no partial metadata must reach the
    // store — the signing processor would otherwise try to use corrupt data.
    grpcService.generateKey.mockReturnValue(
      errAsync(new Error("gRPC failed.")),
    );

    await expect(processor.process(makeJob(JOB_DATA))).rejects.toThrow();
    expect(metadataService.store).not.toHaveBeenCalled();
  });
});
