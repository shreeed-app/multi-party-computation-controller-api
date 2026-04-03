import { getQueueToken } from "@nestjs/bullmq";
import { Test, type TestingModule } from "@nestjs/testing";
import { type Queue } from "bullmq";

import { JobAttempts, QueueName } from "@/queue/queue.constants";
import {
  type SigningRequestDto,
  type SigningResponseDto,
} from "@/tasks/signing/signing.dto";
import { SigningService } from "@/tasks/signing/signing.service";

// Minimal valid DTO reused across all tests.
const DTO: SigningRequestDto = {
  keyIdentifier: "1",
  message: "abcdef",
};

describe("SigningService", () => {
  let service: SigningService;
  let queue: jest.Mocked<Queue>;

  beforeEach(async () => {
    // Mock only the `add` method; all other Queue internals are irrelevant.
    queue = {
      add: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<Queue>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SigningService,
        {
          provide: getQueueToken(QueueName.SIGNING),
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get(SigningService);
  });

  it("Returns a jobId that matches the one added to the queue.", async () => {
    // Act — the service generates the jobId internally via randomUUID.
    const response: SigningResponseDto = await service.enqueue(DTO);

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
        message: DTO.message,
      }),
      expect.any(Object),
    );
  });
});
