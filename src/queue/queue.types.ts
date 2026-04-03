import { type Algorithm } from "@/grpc/grpc.types";

/**
 * Data payload stored in a key-generation BullMQ job. Mirrors the fields
 * forwarded to the `GenerateKey` gRPC RPC.
 */
type KeyGenerationJobData = {
  /** Stable application-assigned key identifier. */
  readonly keyIdentifier: string;

  /** Algorithm to use. */
  readonly algorithm: Algorithm;

  /** Minimum participants required to produce a valid signature. */
  readonly threshold: number;

  /** Total number of nodes in the protocol (n of t-of-n). */
  readonly participants: number;
};

/**
 * Data payload stored in a signing BullMQ job. The `publicKeyPackage`,
 * `algorithm`, `threshold`, and `participants` are looked up at processing
 * time from the key-metadata store.
 */
type SigningJobData = {
  /** Identifier of the key to sign with; match a completed key-generation. */
  readonly keyIdentifier: string;

  /** Hex-encoded raw bytes to sign (no 0x prefix). */
  readonly message: string;
};

/**
 * Return value of a successfully completed key-generation job. Both fields are
 * also persisted to the key-metadata store for subsequent signing calls.
 */
type KeyGenerationJobResult = {
  /** Hex-encoded canonical public key. */
  readonly publicKey: string;

  /**
   * Base64-encoded opaque protocol package. Must be passed unchanged to every
   * subsequent signing call.
   */
  readonly publicKeyPackage: string;
};

/** Return value of a successfully completed signing job. */
type SigningJobResult = {
  /**
   * Hex-encoded raw signature bytes.
   *
   * - FROST: 64 bytes (r ‖ s)
   * - CGGMP24: r ‖ s (32 + 32 bytes), recovery id in `recoveryId`.
   */
  readonly signature: string;

  /**
   * ECDSA recovery id (0–3), present only for CGGMP24. `null` for FROST
   * algorithms.
   */
  readonly recoveryId: number | null;
};

export {
  type KeyGenerationJobData,
  type KeyGenerationJobResult,
  type SigningJobData,
  type SigningJobResult,
};
