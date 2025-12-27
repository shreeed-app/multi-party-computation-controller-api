import { Injectable } from "@nestjs/common";

import { KeysService } from "@/services/keys/keys.service";
import { type SignDigestDto } from "@/services/sign/sign.dto";
import { SignService } from "@/services/sign/sign.service";
import { type PartialSignature } from "@/services/sign/sign.types";

@Injectable()
class PrivateSignatureService {
  constructor(
    private readonly vaultService: KeysService,
    private readonly signService: SignService,
  ) {}

  async sign(dto: SignDigestDto): Promise<PartialSignature> {
    const share: string = await this.vaultService.getKeyShare(
      dto.keyId,
      dto.chain,
    );

    return this.signService.partialSign({
      chain: dto.chain,
      digest: dto.digest,
      share: share,
    });
  }
}

export { PrivateSignatureService };
