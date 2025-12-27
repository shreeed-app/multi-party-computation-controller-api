import { IsInt, IsString, Min } from "class-validator";

class StoreShareDto {
  @IsString()
  keyId: string;

  @IsString()
  chain: string;

  @IsString()
  share: string;

  @IsInt()
  @Min(1)
  threshold: number;
}

export { StoreShareDto };
