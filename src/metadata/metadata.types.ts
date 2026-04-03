import { type Algorithm } from "@/grpc/grpc.types";

/**
 * Key metadata persisted in Redis after a successful key generation job.
 * Retrieved by `keyIdentifier` to supply the required parameters to Sign
 * calls.
 */
type Metadata = {
  /** Algorithm used during key generation. */
  readonly algorithm: Algorithm;

  /** Threshold used during key generation (t of t-of-n). */
  readonly threshold: number;

  /** Participant count used during key generation (n of t-of-n). */
  readonly participants: number;

  /**
   * Base64-encoded `publicKeyPackage` returned by `GenerateKey`. Opaque; must
   * be forwarded unchanged to each `Sign` call.
   */
  readonly publicKeyPackage: string;

  /** Hex-encoded canonical public key. */
  readonly publicKey: string;

  /** ISO-8601 timestamp of when the metadata was stored. */
  readonly storedAt: string;
};

export { type Metadata };
