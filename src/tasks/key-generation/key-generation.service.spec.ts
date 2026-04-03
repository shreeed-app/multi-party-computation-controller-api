import { getQueueToken } from "@nestjs/bullmq";
import { Test, type TestingModule } from "@nestjs/testing";
import { type Queue } from "bullmq";

import { Algorithm } from "@/grpc/grpc.types";
import { JobAttempts, QueueName } from "@/queue/queue.constants";
import {
  type KeyGenerationRequestDto,
  type KeyGenerationResponseDto,
} from "@/tasks/key-generation/key-generation.dto";
import { KeyGenerationService } from "@/tasks/key-generation/key-generation.service";

// Minimal valid DTO reused across all tests.
const DTO: KeyGenerationRequestDto = {
  keyIdentifier: "1",
  algorithm: Algorithm.FROST_ED25519,
  threshold: 2,
  participants: 3,
};

describe("KeyGenerationService", () => {
  let service: KeyGenerationService;
  let queue: jest.Mocked<Queue>;

  beforeEach(async () => {
    // Mock only the `add` method; all other Queue internals are irrelevant.
    queue = {
      add: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<Queue>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyGenerationService,
        {
          provide: getQueueToken(QueueName.KEY_GENERATION),
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get(KeyGenerationService);
  });

  it("Returns a jobId that matches the one added to the queue.", async () => {
    // Act — the service generates the jobId internally via randomUUID.
    const response: KeyGenerationResponseDto = await service.enqueue(DTO);

    // Assert — the same UUID must be used for both the response and the job
    // options so the caller can poll by that identifier.
    expect(response.jobId).toBeTruthy();
    expect(queue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ jobId: response.jobId }),
    );
  });

  it("Enqueues with a single attempt (no automatic retry).", async () => {
    // BullMQ v5 removed the per-job `timeout` option; retries and timeouts
    // are both managed at the Worker level.
    await service.enqueue(DTO);

    expect(queue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        attempts: JobAttempts.SINGLE,
      }),
    );
  });

  it("Forwards all DTO fields as job data.", async () => {
    // The processor receives exactly what the service puts in the payload;
    // ensure no field is silently dropped or renamed.
    await service.enqueue(DTO);

    expect(queue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        keyIdentifier: DTO.keyIdentifier,
        algorithm: DTO.algorithm,
        threshold: DTO.threshold,
        participants: DTO.participants,
      }),
      expect.any(Object),
    );
  });
});
