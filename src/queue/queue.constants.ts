/**
 * BullMQ queue name constants. Centralized here to avoid typo-driven
 * mismatches between producers and processors.
 */
const QueueName = {
  /** Queue for distributed key-generation jobs. */
  KEY_GENERATION: "key-generation",

  /** Queue for threshold-signature jobs. */
  SIGNING: "signing",
} as const;

type QueueName = (typeof QueueName)[keyof typeof QueueName];

/**
 * BullMQ job timeout constants, in milliseconds.
 *
 * These values are set slightly above the Rust engine's internal limits so
 * that the engine always returns a proper gRPC error before BullMQ kills the
 * worker process.
 */
const JobTimeout = {
  /**
   * Key-generation timeout: 700 s. Covers CGGMP24 worst-case (10–60 s+) with
   * margin, below the engine's 600 s cap.
   */
  KEY_GENERATION: 700_000,

  /**
   * Signing timeout: 2 min. Well above typical threshold-signature duration
   * across well-connected nodes.
   */
  SIGNING: 120_000,
} as const;

/**
 * Number of BullMQ job attempts.
 *
 * Both operations are set to a single attempt because the Rust engine does not
 * support resuming a partial protocol session. A failed run must be restarted
 * from scratch via a new job.
 */
const JobAttempts = {
  SINGLE: 1,
} as const;

export { JobAttempts, JobTimeout, QueueName };
