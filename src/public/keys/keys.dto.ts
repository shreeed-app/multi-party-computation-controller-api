import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class KeyShareDto {
  @IsString()
  nodeName: string;

  @IsString()
  share: string;
}

class AddKeyDto {
  @IsString()
  keyId: string;

  @IsString()
  chain: string;

  @IsInt()
  @Min(1)
  threshold: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyShareDto)
  shares: KeyShareDto[];
}

export { AddKeyDto, KeyShareDto };
