import { Injectable, ServiceUnavailableException } from "@nestjs/common";

import Message from "@/common/constants/message";
import AllSettled from "@/common/utils/all-settled";
import { NodesService } from "@/services/node/node.service";
import { type SignDigestDto } from "@/services/sign/sign.dto";
import { type SignResponseDto } from "@/services/sign/sign.response.dto";
import { SignService } from "@/services/sign/sign.service";
import {
  FinalSignature,
  type PartialSignature,
} from "@/services/sign/sign.types";

@Injectable()
class PublicSignatureService {
  constructor(
    private readonly nodesService: NodesService,
    private readonly signService: SignService,
  ) {}

  /**
   * Signs a digest by requesting partial signatures from all nodes and
   * aggregating them.
   *
   * @param {SignDigestDto} dto - The data transfer object containing the
   *   digest to be signed.
   * @returns {Promise<SignResponseDto>} A promise that resolves to the final
   *   signature response DTO.
   */
  async sign(dto: SignDigestDto): Promise<SignResponseDto> {
    const settled: AllSettled<PartialSignature> =
      await this.nodesService.requestPartialSignatures(dto);

    if (!settled.success())
      throw new ServiceUnavailableException(Message.SIGNING_FAILED);

    const signatures: PartialSignature[] = settled.results();
    const final: FinalSignature = this.signService.aggregate(signatures);
    return { signature: final.signature };
  }
}

export { PublicSignatureService };
