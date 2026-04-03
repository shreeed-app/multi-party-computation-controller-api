import { Message } from "@/common/constants/message";
import { JobsService } from "@/jobs/jobs.service";
import {
  BullMQJobState,
  JobStatus,
  JobType,
  type JobStatusResponse,
} from "@/jobs/jobs.types";
import { QueueName } from "@/queue/queue.constants";
import { type KeyGenerationJobResult } from "@/queue/queue.types";
import { getQueueToken } from "@nestjs/bullmq";
import { NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { type Job, type Queue } from "bullmq";

// Interface matching the minimal subset of the BullMQ Job properties accessed
// by JobsService. Only the fields used in mapJobToResponse are exercised.
interface MockJobOptions {
  id?: string;
  state?: BullMQJobState;
  timestamp?: number;
  processedOn?: number | null;
  finishedOn?: number | null;
  returnvalue?: unknown;
  failedReason?: string;
}

// Factory that builds a minimal Job stub. Defaults produce a completed job
// to keep individual tests concise; each test overrides only what it needs.
const makeJob = (options: MockJobOptions = {}): Job => {
  const {
    id = "1",
    state = BullMQJobState.COMPLETED,
    timestamp = Date.now(),
    processedOn = Date.now() + 1_000,
    finishedOn = Date.now() + 2_000,
    returnvalue = { publicKey: "0x000000", publicKeyPackage: "base64==" },
    failedReason = undefined,
  } = options;

  return {
    id,
    timestamp,
    processedOn,
    finishedOn,
    returnvalue,
    failedReason,
    // GetState() is async in BullMQ; mock it to return synchronously.
    getState: jest.fn().mockResolvedValue(state),
  } as unknown as Job;
};

describe("JobsService", () => {
  let service: JobsService;
  let keyGenerationQueue: jest.Mocked<Queue>;
  let signingQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    // Provide only `getJob`; other Queue methods are not exercised here.
    keyGenerationQueue = {
      getJob: jest.fn(),
    } as unknown as jest.Mocked<Queue>;

    signingQueue = {
      getJob: jest.fn(),
    } as unknown as jest.Mocked<Queue>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getQueueToken(QueueName.KEY_GENERATION),
          useValue: keyGenerationQueue,
        },
        {
          provide: getQueueToken(QueueName.SIGNING),
          useValue: signingQueue,
        },
      ],
    }).compile();

    service = module.get(JobsService);
  });

  describe("getJobStatus", () => {
    it("Finds a job in the key-generation queue and sets the correct type.", async () => {
      const id: string = "1";
      // The service searches key-generation first; the response type must
      // reflect the queue where the job was found.
      keyGenerationQueue.getJob.mockResolvedValue(makeJob({ id }));

      const response: JobStatusResponse = await service.getJobStatus(id);

      expect(response.jobId).toBe(id);
      expect(response.type).toBe(JobType.KEY_GENERATION);
    });

    it("Falls back to the signing queue when not found in key-generation.", async () => {
      const id: string = "2";
      // GetJob returning undefined signals "not in this queue".
      keyGenerationQueue.getJob.mockResolvedValue(undefined);
      signingQueue.getJob.mockResolvedValue(makeJob({ id }));

      const response: JobStatusResponse = await service.getJobStatus(id);

      expect(response.type).toBe(JobType.SIGNING);
    });

    it("Does not query the signing queue when the job exists in key-generation.", async () => {
      // Short-circuit: avoid an unnecessary Redis round-trip once the job
      // has already been located in the first queue.
      keyGenerationQueue.getJob.mockResolvedValue(makeJob());

      await service.getJobStatus("_");

      expect(signingQueue.getJob).not.toHaveBeenCalled();
    });

    it("Throws NotFoundException when the job is absent from both queues.", async () => {
      const id: string = "ghost";
      // A job that exists in neither queue is treated as unknown; the
      // 404 message includes the jobId so callers can diagnose bad requests.
      keyGenerationQueue.getJob.mockResolvedValue(undefined);
      signingQueue.getJob.mockResolvedValue(undefined);

      await expect(service.getJobStatus(id)).rejects.toThrow(
        new NotFoundException(Message.JOB_NOT_FOUND(id)),
      );
    });
  });

  describe("BullMQ state → JobStatus mapping.", () => {
    // BullMQ exposes several internal states that the public API collapses
    // into four: pending, processing, completed, and failed.
    it.each([
      [BullMQJobState.ACTIVE, JobStatus.PROCESSING],
      [BullMQJobState.COMPLETED, JobStatus.COMPLETED],
      [BullMQJobState.FAILED, JobStatus.FAILED],
      // All pre-processing states map to PENDING from the client's view.
      [BullMQJobState.WAITING, JobStatus.PENDING],
      [BullMQJobState.DELAYED, JobStatus.PENDING],
      [BullMQJobState.PRIORITIZED, JobStatus.PENDING],
      [BullMQJobState.WAITING_CHILDREN, JobStatus.PENDING],
    ])(
      "Maps '%s' → %s.",
      async (bullmqState: BullMQJobState, expectedStatus: JobStatus) => {
        keyGenerationQueue.getJob.mockResolvedValue(
          makeJob({ state: bullmqState }),
        );

        const response: JobStatusResponse = await service.getJobStatus("_");

        expect(response.status).toBe(expectedStatus);
      },
    );
  });

  describe("Result and error fields.", () => {
    it("Exposes returnvalue as result on a completed job.", async () => {
      // The returnvalue stored by the processor is forwarded verbatim to the
      // polling client; no re-serialization happens in the service layer.
      const returnvalue: KeyGenerationJobResult = {
        publicKey: "0x000000",
        publicKeyPackage: "base64==",
      };

      keyGenerationQueue.getJob.mockResolvedValue(
        makeJob({ state: BullMQJobState.COMPLETED, returnvalue }),
      );

      const response: JobStatusResponse = await service.getJobStatus("any");

      expect(response.result).toEqual(returnvalue);
      expect(response.error).toBeNull();
    });

    it("Exposes failedReason as error on a failed job.", async () => {
      const message: string = "Engine error [14]: connection lost.";
      // FailedReason is set by BullMQ from the thrown Error's message after
      // all attempts are exhausted; surface it as-is in the API response.
      keyGenerationQueue.getJob.mockResolvedValue(
        makeJob({
          state: BullMQJobState.FAILED,
          failedReason: message,
        }),
      );

      const response: JobStatusResponse = await service.getJobStatus("_");

      expect(response.error).toBe(message);
      expect(response.result).toBeNull();
    });

    it("Has null result and null error for a pending job.", async () => {
      // Neither result nor error is available before the job is processed;
      // both fields must be null so the client knows to keep polling.
      keyGenerationQueue.getJob.mockResolvedValue(
        makeJob({ state: BullMQJobState.WAITING }),
      );

      const response: JobStatusResponse = await service.getJobStatus("_");

      expect(response.result).toBeNull();
      expect(response.error).toBeNull();
    });
  });

  describe("timestamp fields", () => {
    it("Sets createdAt from job.timestamp.", async () => {
      // Job.timestamp is the Unix ms epoch set when the job was enqueued;
      // the API surface converts it to ISO-8601 for easier client parsing.
      const timestamp: number = new Date().getTime();
      keyGenerationQueue.getJob.mockResolvedValue(makeJob({ timestamp }));

      const response: JobStatusResponse = await service.getJobStatus("_");

      expect(response.createdAt).toBe(new Date(timestamp).toISOString());
    });

    it("Sets updatedAt from finishedOn when available.", async () => {
      // FinishedOn takes precedence over processedOn as the last-updated
      // timestamp; it reflects the most recent terminal state transition.
      const finishedOn: number = new Date().getTime();
      keyGenerationQueue.getJob.mockResolvedValue(makeJob({ finishedOn }));

      const response: JobStatusResponse = await service.getJobStatus("_");

      expect(response.updatedAt).toBe(new Date(finishedOn).toISOString());
    });
  });
});
