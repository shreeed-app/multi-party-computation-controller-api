import { Body, Controller, Post } from "@nestjs/common";

import { PublicSignatureService } from "@/public/sign/sign.service";
import { SignDigestDto } from "@/services/sign/sign.dto";
import { SignResponseDto } from "@/services/sign/sign.response.dto";

@Controller("sign")
class PublicSignatureController {
  constructor(private readonly service: PublicSignatureService) {}

  @Post()
  async sign(@Body() dto: SignDigestDto): Promise<SignResponseDto> {
    return this.service.sign(dto);
  }
}

export { PublicSignatureController };
