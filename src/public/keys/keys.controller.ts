import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import Endpoint from "@/common/constants/endpoint";
import { AddKeyDto } from "@/public/keys/keys.dto";
import { AddKeyResponseDto } from "@/public/keys/keys.response.dto";
import { KeysService } from "@/public/keys/keys.service";

@Controller(Endpoint.KEYS)
class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addKey(@Body() dto: AddKeyDto): Promise<AddKeyResponseDto> {
    return this.keysService.addKey(dto);
  }
}

export { KeysController };
