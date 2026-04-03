import { getQueueToken } from "@nestjs/bullmq";
import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import type { Job, Queue } from "bullmq";
import request, { Response } from "supertest";

import { AppConfigService } from "@/common/config/config.service";
import { Endpoint } from "@/common/constants/endpoint";
import { AuthScheme, Header } from "@/common/constants/header";
import { Message } from "@/common/constants/message";
import { Algorithm } from "@/grpc/grpc.types";
import { JobsController } from "@/jobs/jobs.controller";
import { JobsService } from "@/jobs/jobs.service";
import {
  BullMQJobState,
  JobStatus,
  type JobStatusResponse,
  JobType,
} from "@/jobs/jobs.types";
import { QueueName } from "@/queue/queue.constants";
import {
  type KeyGenerationJobResult,
  type SigningJobResult,
} from "@/queue/queue.types";
import { KeyGenerationController } from "@/tasks/key-generation/key-generation.controller";
import { type KeyGenerationRequestDto } from "@/tasks/key-generation/key-generation.dto";
import { KeyGenerationService } from "@/tasks/key-generation/key-generation.service";
import { SigningController } from "@/tasks/signing/signing.controller";
import { type SigningRequestDto } from "@/tasks/signing/signing.dto";
import { SigningService } from "@/tasks/signing/signing.service";
import { randomBytes } from "crypto";
import { type App } from "supertest/types";

const TOKEN: string = randomBytes(32).toString("hex");
const AUTH: string = `${AuthScheme.BEARER_PREFIX} ${TOKEN}`;

type ApiResponse = Response & { body: JobStatusResponse };
type BodyResponse = { body: { message: string } };

type Options = {
  jobId?: string;
  state: string;
  returnvalue?: unknown;
  failedReason?: string;
};

/**
 * Builds a minimal BullMQ Job-like object for use in GET /jobs tests.
 *
 * @param {Options} options - The options to customize the job's properties and
 *   state.
 * @returns {Job} A mock Job object with the specified properties and a
 *   getState method.
 */
const mockJob = (options: Options): Job => {
  return {
    id: options.jobId ?? "id",
    getState: jest.fn().mockResolvedValue(options.state),
    returnvalue: options.returnvalue ?? null,
    failedReason: options.failedReason ?? "",
    timestamp: Date.now(),
    processedOn: undefined,
    finishedOn: undefined,
  } as unknown as Job;
};

describe("App (e2e)", (): void => {
  let app: INestApplication<App>;
  let keyGenQueue: jest.Mocked<Pick<Queue, "add" | "getJob">>;
  let signingQueue: jest.Mocked<Pick<Queue, "add" | "getJob">>;

  beforeAll(async (): Promise<void> => {
    keyGenQueue = {
      add: jest.fn().mockResolvedValue(undefined),
      getJob: jest.fn().mockResolvedValue(undefined),
    };

    signingQueue = {
      add: jest.fn().mockResolvedValue(undefined),
      getJob: jest.fn().mockResolvedValue(undefined),
    };

    // Compose only the HTTP layer (controllers + services + a mock config).
    // AppConfigModule is intentionally excluded to avoid loading the real .env
    // file, which would override the test token. BullMQ workers/processors are
    // also excluded — they require a real Redis connection and are covered by
    // the unit tests in src/queue/.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        KeyGenerationController,
        SigningController,
        JobsController,
      ],
      providers: [
        KeyGenerationService,
        SigningService,
        JobsService,
        {
          provide: getQueueToken(QueueName.KEY_GENERATION),
          useValue: keyGenQueue,
        },
        { provide: getQueueToken(QueueName.SIGNING), useValue: signingQueue },
        {
          provide: AppConfigService,
          useValue: { clientBearerToken: TOKEN },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(async (): Promise<void> => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    keyGenQueue.add.mockResolvedValue({} as Job);
    signingQueue.add.mockResolvedValue({} as Job);
    keyGenQueue.getJob.mockResolvedValue(undefined);
    signingQueue.getJob.mockResolvedValue(undefined);
  });

  describe("Auth (BearerGuard)", (): void => {
    it("Returns 401 when the Authorization header is missing.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .send({})
        .expect(401)
        .expect(({ body }: BodyResponse) => {
          expect(body.message).toBe(Message.MISSING_AUTH_HEADER);
        });
    });

    it("Returns 401 when the scheme is not Bearer.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(
          Header.AUTHORIZATION,
          `${AuthScheme.BASIC_PREFIX} ${randomBytes(32).toString("hex")}`,
        )
        .send({})
        .expect(401)
        .expect(({ body }: BodyResponse) => {
          expect(body.message).toBe(Message.INVALID_AUTH_SCHEME);
        });
    });

    it("Returns 401 when the token is wrong.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(
          Header.AUTHORIZATION,
          `${AuthScheme.BEARER_PREFIX} ${randomBytes(32).toString("hex")}`,
        )
        .send({})
        .expect(401)
        .expect(({ body }: BodyResponse) => {
          expect(body.message).toBe(Message.INVALID_BEARER_TOKEN);
        });
    });

    it("Returns 404 for unknown routes (auth is bypassed, NestJS routing takes over).", async (): Promise<void> => {
      await request(app.getHttpServer()).get("/").expect(404);
    });
  });

  describe(`POST ${Endpoint.KEY_GENERATION}`, (): void => {
    const validBody = {
      keyIdentifier: "1",
      algorithm: Algorithm.FROST_ED25519,
      threshold: 2,
      participants: 3,
    };

    it("Returns 202 with a jobId for a valid request.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(Header.AUTHORIZATION, AUTH)
        .send(validBody)
        .expect(202)
        .expect(({ body }: { body: JobStatusResponse }) => {
          expect(body.jobId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          );
        });
    });

    it("Enqueues the job with the correct data.", async (): Promise<void> => {
      const response: Response & { body: JobStatusResponse } = await request(
        app.getHttpServer(),
      )
        .post(Endpoint.KEY_GENERATION)
        .set(Header.AUTHORIZATION, AUTH)
        .send(validBody)
        .expect(202);

      expect(keyGenQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          keyIdentifier: validBody.keyIdentifier,
          algorithm: validBody.algorithm,
          threshold: validBody.threshold,
          participants: validBody.participants,
        }),
        expect.objectContaining({ jobId: response.body.jobId }),
      );
    });

    it("Returns 400 for an unknown algorithm.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(Header.AUTHORIZATION, AUTH)
        .send({ ...validBody, algorithm: 99 })
        .expect(400);
    });

    it("Returns 400 when threshold < 2.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(Header.AUTHORIZATION, AUTH)
        .send({ ...validBody, threshold: 1 })
        .expect(400);
    });

    it("Returns 400 when participants < 2.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(Header.AUTHORIZATION, AUTH)
        .send({ ...validBody, participants: 1 })
        .expect(400);
    });

    it("Returns 400 when threshold exceeds participants.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(Header.AUTHORIZATION, AUTH)
        .send({ ...validBody, threshold: 4, participants: 3 })
        .expect(400);
    });

    it("Returns 400 when keyIdentifier is missing.", async (): Promise<void> => {
      const { keyIdentifier: _, ...body }: KeyGenerationRequestDto = validBody;
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(Header.AUTHORIZATION, AUTH)
        .send(body)
        .expect(400);
    });

    it("Returns 400 when algorithm is missing.", async (): Promise<void> => {
      const { algorithm: _, ...body }: KeyGenerationRequestDto = validBody;
      await request(app.getHttpServer())
        .post(Endpoint.KEY_GENERATION)
        .set(Header.AUTHORIZATION, AUTH)
        .send(body)
        .expect(400);
    });
  });

  describe(`POST ${Endpoint.SIGNING}`, (): void => {
    const validBody: SigningRequestDto = {
      keyIdentifier: "1",
      message: randomBytes(32).toString("hex"),
    };

    it("Returns 202 with a jobId for a valid request.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.SIGNING)
        .set(Header.AUTHORIZATION, AUTH)
        .send(validBody)
        .expect(202)
        .expect(({ body }: { body: JobStatusResponse }) => {
          expect(body.jobId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          );
        });
    });

    it("Enqueues the job with the correct data.", async (): Promise<void> => {
      const response: ApiResponse = await request(app.getHttpServer())
        .post(Endpoint.SIGNING)
        .set(Header.AUTHORIZATION, AUTH)
        .send(validBody)
        .expect(202);

      expect(signingQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          keyIdentifier: validBody.keyIdentifier,
          message: validBody.message,
        }),
        expect.objectContaining({ jobId: response.body.jobId }),
      );
    });

    it("Returns 400 when message is not hexadecimal.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.SIGNING)
        .set(Header.AUTHORIZATION, AUTH)
        .send({ ...validBody, message: randomBytes(16).toString("base64") })
        .expect(400);
    });

    it("Returns 400 when message is empty.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.SIGNING)
        .set(Header.AUTHORIZATION, AUTH)
        .send({ ...validBody, message: "" })
        .expect(400);
    });

    it("Returns 400 when keyIdentifier is missing.", async (): Promise<void> => {
      await request(app.getHttpServer())
        .post(Endpoint.SIGNING)
        .set(Header.AUTHORIZATION, AUTH)
        .send({ message: validBody.message })
        .expect(400);
    });
  });

  describe(`GET ${Endpoint.JOBS}/:jobId`, () => {
    it("Returns 404 when the jobId does not exist.", async (): Promise<void> => {
      const jobId: string = "unknown-id";

      await request(app.getHttpServer())
        .get(`${Endpoint.JOBS}/${jobId}`)
        .set(Header.AUTHORIZATION, AUTH)
        .expect(404)
        .expect(({ body }: BodyResponse) => {
          expect(body.message).toBe(Message.JOB_NOT_FOUND(`${jobId}`));
        });
    });

    it(`Returns status=${JobStatus.PENDING} for a waiting ${JobType.KEY_GENERATION} job.`, async (): Promise<void> => {
      keyGenQueue.getJob.mockResolvedValueOnce(
        mockJob({ state: BullMQJobState.WAITING }),
      );

      const jobId: string = "id";

      await request(app.getHttpServer())
        .get(`${Endpoint.JOBS}/${jobId}`)
        .set(Header.AUTHORIZATION, AUTH)
        .expect(200)
        .expect(({ body }: { body: JobStatusResponse }) => {
          expect(body).toMatchObject({
            jobId,
            type: JobType.KEY_GENERATION,
            status: JobStatus.PENDING,
            result: null,
            error: null,
          });
          expect(body.createdAt).toBeTruthy();
          expect(body.updatedAt).toBeTruthy();
        });
    });

    it(`Returns status=${JobStatus.PROCESSING} for an active ${JobType.SIGNING} job.`, async (): Promise<void> => {
      signingQueue.getJob.mockResolvedValueOnce(
        mockJob({ state: BullMQJobState.ACTIVE }),
      );

      await request(app.getHttpServer())
        .get(`${Endpoint.JOBS}/id`)
        .set(Header.AUTHORIZATION, AUTH)
        .expect(200)
        .expect(({ body }: { body: JobStatusResponse }) => {
          expect(body).toMatchObject({
            type: JobType.SIGNING,
            status: JobStatus.PROCESSING,
            result: null,
            error: null,
          });
        });
    });

    it(`Returns status=${JobStatus.COMPLETED} with result for a finished ${JobType.KEY_GENERATION} job.`, async (): Promise<void> => {
      const result: KeyGenerationJobResult = {
        publicKey: "0x000000",
        publicKeyPackage: "base64==",
      };

      keyGenQueue.getJob.mockResolvedValueOnce(
        mockJob({
          state: BullMQJobState.COMPLETED,
          returnvalue: result,
        }),
      );

      await request(app.getHttpServer())
        .get(`${Endpoint.JOBS}/id`)
        .set(Header.AUTHORIZATION, AUTH)
        .expect(200)
        .expect(({ body }: { body: JobStatusResponse }) => {
          expect(body).toMatchObject({
            type: JobType.KEY_GENERATION,
            status: JobStatus.COMPLETED,
            result,
            error: null,
          });
        });
    });

    it("Returns status=completed with result for a finished signing job.", async (): Promise<void> => {
      const result: SigningJobResult = {
        signature: "abcdef",
        recoveryId: null,
      };

      signingQueue.getJob.mockResolvedValueOnce(
        mockJob({
          state: BullMQJobState.COMPLETED,
          returnvalue: result,
        }),
      );

      await request(app.getHttpServer())
        .get(`${Endpoint.JOBS}/test-id`)
        .set(Header.AUTHORIZATION, AUTH)
        .expect(200)
        .expect(({ body }: { body: JobStatusResponse }) => {
          expect(body).toMatchObject({
            type: JobType.SIGNING,
            status: JobStatus.COMPLETED,
            result,
            error: null,
          });
        });
    });

    it("Returns status=failed with error for a failed job.", async (): Promise<void> => {
      const failedReason: string = Message.ENGINE_ERROR(
        2,
        "Protocol aborted.",
      );

      keyGenQueue.getJob.mockResolvedValueOnce(
        mockJob({ state: BullMQJobState.FAILED, failedReason }),
      );

      await request(app.getHttpServer())
        .get(`${Endpoint.JOBS}/id`)
        .set(Header.AUTHORIZATION, AUTH)
        .expect(200)
        .expect(({ body }: { body: JobStatusResponse }) => {
          expect(body).toMatchObject({
            type: JobType.KEY_GENERATION,
            status: JobStatus.FAILED,
            result: null,
            error: failedReason,
          });
        });
    });
  });
});
