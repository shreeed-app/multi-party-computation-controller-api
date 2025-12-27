import { IsHexadecimal, IsNotEmpty, IsString } from "class-validator";

class SignDigestDto {
  /** Logical identifier of the key (shared across nodes). */
  @IsString()
  @IsNotEmpty()
  keyId: string;

  /** Blockchain identifier. */
  @IsString()
  @IsNotEmpty()
  chain: string;

  /** Digest to sign (hex-encoded, without 0x). */
  @IsString()
  @IsHexadecimal()
  digest: string;
}

export { SignDigestDto };
