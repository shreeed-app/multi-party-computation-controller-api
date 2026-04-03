import { Algorithm } from "@/grpc/grpc.types";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotIn,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from "class-validator";
import { v4 } from "uuid";

/**
 * Custom cross-field validator: ensures `threshold` does not exceed
 * `participants`. Checked only after both fields pass their individual
 * constraints, so this is the last guard.
 */
@ValidatorConstraint({ name: "thresholdWithinParticipants", async: false })
class ThresholdWithinParticipants implements ValidatorConstraintInterface {
  /**
   * @param {number} threshold - The threshold value to validate.
   * @param {ValidationArguments} args - Context containing the parent DTO.
   * @returns {boolean} `true` if threshold is within participants or not yet
   *   parseable.
   */
  validate(threshold: number, { object }: ValidationArguments): boolean {
    const dto: KeyGenerationRequestDto = object as KeyGenerationRequestDto;
    // If `participants` hasn't been parsed yet, defer to its own validator.
    return dto.participants === undefined || threshold <= dto.participants;
  }


  /**
   * @returns {string} The default validation failure message.
   */
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
  @ApiProperty({
    description:
      "Unique identifier for the key (1–128 chars, alphanumeric, hyphens, underscores).",
    example: "wallet-1",
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  keyIdentifier: string;

  /**
   * Algorithm to use for distributed key generation.
   *
   * - `FROST_ED25519` / `FROST_SCHNORR_SECP256K1`: fast (< 1 s), suitable for
   *   Solana, Bitcoin Schnorr.
   * - `CGGMP24_ECDSA_SECP256K1`: slow (10–60 s+), for Ethereum/EVM.
   */
  @ApiProperty({
    description: "Algorithm to use for distributed key generation.",
    enum: Algorithm,
    example: Algorithm.FROST_ED25519,
  })
  @IsEnum(Algorithm)
  @Validate(ThresholdWithinParticipants)
  @IsNotIn([Algorithm.ALGORITHM_UNSPECIFIED])
  algorithm: Algorithm;

  /**
   * Minimum number of nodes required to produce a valid signature (t in
   * t-of-n). Must be ≥ 2, ≤ 255, and ≤ `participants`.
   */
  @ApiProperty({
    description:
      "Minimum number of nodes for a valid signature " +
      "(t-of-n). Must be ≤ participants.",
    example: 2,
    minimum: 2,
    maximum: 255,
  })
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
  @ApiProperty({
    description: "Total number of nodes participating (n-of-n).",
    example: 3,
    minimum: 2,
    maximum: 255,
  })
  @IsInt()
  @Min(2)
  @Max(255)
  participants: number;
}

/** Response body for a successful `POST /key-generation` (202 Accepted). */
class KeyGenerationResponseDto {
  @ApiProperty({
    description: "Opaque job identifier for status polling.",
    example: v4(),
  })
  jobId: string;
}

export {
  KeyGenerationRequestDto,
  KeyGenerationResponseDto,
  ThresholdWithinParticipants,
};
