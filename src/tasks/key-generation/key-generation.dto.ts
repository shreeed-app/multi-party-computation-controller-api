import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from "class-validator";

import { Algorithm } from "@/grpc/grpc.types";

/**
 * Custom cross-field validator: ensures `threshold` does not exceed
 * `participants`. Checked only after both fields pass their individual
 * constraints, so this is the last guard.
 */
@ValidatorConstraint({ name: "thresholdWithinParticipants", async: false })
class ThresholdWithinParticipants implements ValidatorConstraintInterface {
  validate(threshold: number, { object }: ValidationArguments): boolean {
    const dto: KeyGenerationRequestDto = object as KeyGenerationRequestDto;
    // If `participants` hasn't been parsed yet, defer to its own validator.
    return dto.participants === undefined || threshold <= dto.participants;
  }

  defaultMessage({ value }: ValidationArguments): string {
    return `Threshold (${value as number}) must not exceed participants.`;
  }
}

/**
 * Request body for `POST /key-generation`.
 *
 * These fields map directly to the `GenerateKeyRequest` proto message. The
 * `algorithm`, `threshold`, and `participants` are stored in the key-metadata
 * store after a successful key generation and reused for all subsequent
 * signing calls on the same key.
 */
class KeyGenerationRequestDto {
  /**
   * Stable application-assigned identifier for this key. Must be unique across
   * all keys; re-using an existing identifier will overwrite the stored key
   * metadata on completion.
   *
   * @example
   *   wallet - 1;
   */
  @IsString()
  @IsNotEmpty()
  keyIdentifier: string;

  /**
   * MPC algorithm to use for distributed key generation.
   *
   * - `FROST_ED25519` / `FROST_SCHNORR_SECP256K1`: fast (< 1 s), suitable for
   *   Solana, Bitcoin Schnorr.
   * - `CGGMP24_ECDSA_SECP256K1`: slow (10–60 s+), for Ethereum/EVM.
   */
  @IsEnum(Algorithm)
  algorithm: Algorithm;

  /**
   * Minimum number of nodes required to produce a valid signature (t in
   * t-of-n). Must be ≥ 2, ≤ 255, and ≤ `participants`.
   */
  @IsInt()
  @Min(2)
  @Max(255)
  @Validate(ThresholdWithinParticipants)
  threshold: number;

  /**
   * Total number of nodes participating in the key-generation protocol (n in
   * t-of-n). Must be ≥ 2 and match the number of nodes configured in
   * `controller.toml`.
   */
  @IsInt()
  @Min(2)
  @Max(255)
  participants: number;
}

/** Response body for a successful `POST /key-generation` (202 Accepted). */
class KeyGenerationResponseDto {
  /** Opaque job identifier; poll `GET /jobs/:jobId` to track progress. */
  jobId: string;
}

export {
  KeyGenerationRequestDto,
  KeyGenerationResponseDto,
  ThresholdWithinParticipants,
};
