import {
  type KeyGenerationJobResult,
  type SigningJobResult,
} from "@/queue/queue.types";

enum BullMQJobState {
  WAITING = "waiting",
  DELAYED = "delayed",
  PRIORITIZED = "prioritized",
  WAITING_CHILDREN = "waiting-children",
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed",
}

/** Canonical job status values exposed over the HTTP polling API. */
enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

/** Discriminates key-generation from signing jobs in the polling response. */
enum JobType {
  KEY_GENERATION = "key-generation",
  SIGNING = "signing",
}

/** Union of all possible job result payloads. */
type JobResult = KeyGenerationJobResult | SigningJobResult;

/**
 * Response body for `GET /jobs/:jobId`. Returned regardless of the current job
 * status.
 */
type JobStatusResponse = {
  /** Opaque job identifier returned when the job was enqueued. */
  readonly jobId: string;

  /** Whether this is a key-generation or signing job. */
  readonly type: JobType;

  /** Current lifecycle status of the job. */
  readonly status: JobStatus;

  /**
   * Job result payload, populated only when `status ===
   * {@link JobStatus.COMPLETED}`.
   *
   * - Key-generation: `{ publicKey, publicKeyPackage }`
   * - Signing: `{ signature, recoveryId }`.
   */
  readonly result: JobResult | null;

  /**
   * Human-readable error description, populated only when `status ===
   * {@link JobStatus.FAILED}`. Contains the engine error code and message when
   * the failure originates from gRPC.
   */
  readonly error: string | null;

  /** ISO-8601 timestamp of when the job was enqueued. */
  readonly createdAt: string;

  /**
   * ISO-8601 timestamp of the last status transition (processing start,
   * completion, or failure).
   */
  readonly updatedAt: string;
};

export {
  BullMQJobState,
  JobStatus,
  JobType,
  type JobResult,
  type JobStatusResponse,
};
