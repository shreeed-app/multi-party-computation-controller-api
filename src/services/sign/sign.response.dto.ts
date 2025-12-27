import { IsString } from "class-validator";

class SignResponseDto {
  /** Final aggregated signature. */
  @IsString()
  signature: string;
}

export { SignResponseDto };
