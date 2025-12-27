import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { MtlsGuard } from "@/common/auth/mtls.guard";
import Endpoint from "@/common/constants/endpoint";
import { PrivateSignatureService } from "@/private/sign/sign.service";
import { SignDigestDto } from "@/services/sign/sign.dto";
import { type PartialSignature } from "@/services/sign/sign.types";

@UseGuards(MtlsGuard)
@Controller(Endpoint.INTERNAL_SIGN)
class PrivateSignatureController {
  constructor(private readonly service: PrivateSignatureService) {}

  @Post()
  async sign(@Body() dto: SignDigestDto): Promise<PartialSignature> {
    return this.service.sign(dto);
  }
}

export { PrivateSignatureController };
