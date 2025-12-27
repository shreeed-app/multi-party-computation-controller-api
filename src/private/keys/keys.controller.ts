import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import Endpoint from "@/common/constants/endpoint";
import { StoreShareDto } from "@/private/keys/keys.dto";
import { NodeKeysService } from "@/private/keys/keys.service";

@Controller(Endpoint.INTERNAL_KEYS)
class NodeKeysController {
  constructor(private readonly service: NodeKeysService) {}

  @Post(Endpoint.lastSegment(Endpoint.INTERNAL_KEYS_SHARE))
  @HttpCode(HttpStatus.NO_CONTENT)
  async storeShare(@Body() dto: StoreShareDto): Promise<void> {
    await this.service.storeShare(dto);
  }
}

export { NodeKeysController };
