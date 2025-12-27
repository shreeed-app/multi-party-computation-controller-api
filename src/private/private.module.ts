import { Module } from "@nestjs/common";

import { NodeKeysController } from "@/private/keys/keys.controller";
import { NodeKeysService } from "@/private/keys/keys.service";
import { KeysModule } from "@/services/keys/keys.module";

@Module({
  imports: [KeysModule],
  controllers: [NodeKeysController],
  providers: [NodeKeysService],
})
class InternalModule {}

export { InternalModule };
