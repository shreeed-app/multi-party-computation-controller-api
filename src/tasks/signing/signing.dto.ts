import {
  IsHexadecimal,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from "class-validator";

/**
 * Request body for `POST /signing`.
 *
 * The `publicKeyPackage`, `algorithm`, `threshold`, and `participants`
 * required by the engine are retrieved from the key-metadata store using
 * `keyIdentifier`; the client does not need to supply them.
 */
class SigningRequestDto {
  /**
   * Identifier of the key to sign with. Must match the `keyIdentifier` of a
   * previously completed key-generation job.
   */
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  keyIdentifier: string;

  /**
   * Raw bytes to sign, hex-encoded without a `0x` prefix. No additional
   * hashing is performed by the engine; pass the digest (or raw message)
   * according to the target chain convention.
   */
  @IsString()
  @IsHexadecimal()
  @IsNotEmpty()
  @Length(2)
  message: string;
}

/** Response body for a successful `POST /signing` (202 Accepted). */
class SigningResponseDto {
  /** Opaque job identifier; poll `GET /jobs/:jobId` to track progress. */
  jobId: string;
}

export { SigningRequestDto, SigningResponseDto };
