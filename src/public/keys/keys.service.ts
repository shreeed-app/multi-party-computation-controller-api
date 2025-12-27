import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

import { AppConfigService } from "@/common/config/config.service";
import Message from "@/common/constants/message";
import AllSettled from "@/common/utils/all-settled";
import { AddKeyDto, KeyShareDto } from "@/public/keys/keys.dto";
import { AddKeyResponseDto } from "@/public/keys/keys.response.dto";
import { NodesService } from "@/services/node/node.service";
import { NodeInfo } from "@/services/node/node.types";

@Injectable()
class KeysService {
  constructor(
    private readonly nodesService: NodesService,
    private readonly configService: AppConfigService,
  ) {}

  public async addKey(dto: AddKeyDto): Promise<AddKeyResponseDto> {
    // Check if the number of shares matches the number of nodes.
    if (dto.shares.length !== this.configService.nodes.length)
      throw new BadRequestException(Message.SHARES_MISMATCH);

    // Validate that all node IDs in the shares exist.
    const ids: Set<string> = new Set(
      this.configService.nodes.map((node: NodeInfo) => node.name),
    );
    const invalid: KeyShareDto | undefined = dto.shares.find(
      (share: KeyShareDto) => !ids.has(share.nodeName),
    );
    if (invalid)
      throw new BadRequestException(
        Message.UNKNOWN_NODE_NAME(invalid.nodeName),
      );

    // Distribute shares to nodes and handle potential failures.
    const distribution: AllSettled<void> = await AllSettled.from(
      dto.shares.map((share: KeyShareDto) =>
        this.nodesService.sendShareToNode({
          nodeName: share.nodeName,
          keyId: dto.keyId,
          chain: dto.chain,
          share: share.share,
          threshold: dto.threshold,
        }),
      ),
    );

    if (distribution.hasFailures())
      throw new ServiceUnavailableException(Message.SHARE_DISTRIBUTION_FAILED);

    return { keyId: dto.keyId };
  }
}

export { KeysService };
