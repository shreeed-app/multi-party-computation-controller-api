import { type Metadata } from "@grpc/grpc-js";
import { type Observable } from "rxjs";

/**
 * MPC algorithm identifier, mirrors the `Algorithm` proto enum in
 * engine.proto. Use numeric values so they serialize correctly over gRPC.
 */
enum Algorithm {
  ALGORITHM_UNSPECIFIED = 0,
  FROST_ED25519 = 1,
  FROST_SCHNORR_SECP256K1 = 2,
  CGGMP24_ECDSA_SECP256K1 = 3,
}

/**
 * Request payload for the `GenerateKey` RPC. Field names are camelCase because
 * proto-loader converts snake_case by default.
 */
interface GenerateKeyRequest {
  /** Stable application-assigned key identifier (e.g. `"wallet-1"`). */
  readonly keyIdentifier: string;

  /** MPC algorithm to use. */
  readonly algorithm: Algorithm;

  /** Minimum participants required to sign (t of t-of-n). */
  readonly threshold: number;

  /** Total number of nodes in the protocol (n of t-of-n). */
  readonly participants: number;
}

/** Response from the `GenerateKey` RPC. */
interface GenerateKeyResponse {
  /**
   * Canonical public key bytes.
   *
   * - Secp256k1 compressed: 33 bytes
   * - Ed25519: 32 bytes.
   */
  readonly publicKey: Buffer;

  /**
   * Opaque protocol-internal package. Store verbatim; pass back unchanged to
   * every `Sign` call.
   */
  readonly publicKeyPackage: Buffer;
}

/** Request payload for the `Sign` RPC. */
interface SignRequest {
  /** Must match the identifier used during `GenerateKey`. */
  readonly keyIdentifier: string;

  /**
   * Exactly the `publicKeyPackage` bytes returned by the matching
   * `GenerateKey` call.
   */
  readonly publicKeyPackage: Buffer;

  /** Must match the algorithm used during `GenerateKey`. */
  readonly algorithm: Algorithm;

  /** Must match the threshold used during `GenerateKey`. */
  readonly threshold: number;

  /** Must match the participants count used during `GenerateKey`. */
  readonly participants: number;

  /**
   * Raw bytes to sign. Pass the digest or message according to the target
   * chain convention; the engine does not pre-hash.
   */
  readonly message: Buffer;
}

/** ECDSA signature components returned for CGGMP24. */
interface EcdsaSignature {
  /** 32-byte big-endian r component. */
  readonly r: Buffer;

  /** 32-byte big-endian s component. */
  readonly s: Buffer;

  /** Recovery id (0–3). */
  readonly v: number;
}

/**
 * Signature result from the `Sign` RPC. Exactly one of `raw` or `ecdsa` will
 * be set, depending on the algorithm.
 */
interface SignatureResult {
  /** FROST algorithms: 64 raw bytes (r ‖ s). */
  readonly raw?: Buffer;

  /** CGGMP24/ECDSA: r, s, and recovery id. */
  readonly ecdsa?: EcdsaSignature;
}

/** Response from the `Sign` RPC. */
interface SignResponse {
  readonly result: SignatureResult;
}

/** Request payload for the `Abort` RPC. */
interface AbortRequest {
  /** UUID of the protocol session to cancel. */
  readonly sessionIdentifier: string;
}

/** Response from the `Abort` RPC (empty). */
interface AbortResponse {}

/**
 * Typed stub for the `Controller` gRPC service, as returned by
 * `ClientGrpc.getService<ControllerClient>('Controller')`.
 *
 * Accepts an optional {@link Metadata} for per-call headers, such as the
 * `Authorization: Bearer` token required by the engine.
 */
interface ControllerClient {
  generateKey(
    request: GenerateKeyRequest,
    metadata?: Metadata,
  ): Observable<GenerateKeyResponse>;

  sign(request: SignRequest, metadata?: Metadata): Observable<SignResponse>;

  abort(request: AbortRequest, metadata?: Metadata): Observable<AbortResponse>;
}

export {
  Algorithm,
  type AbortRequest,
  type AbortResponse,
  type ControllerClient,
  type EcdsaSignature,
  type GenerateKeyRequest,
  type GenerateKeyResponse,
  type SignatureResult,
  type SignRequest,
  type SignResponse,
};
