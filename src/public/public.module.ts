import { Module } from "@nestjs/common";

import { AppConfigModule } from "@/common/config/config.module";
import { KeysController } from "@/public/keys/keys.controller";
import { KeysService } from "@/public/keys/keys.service";
import { NodesModule } from "@/services/node/node.module";

@Module({
  imports: [NodesModule, AppConfigModule],
  controllers: [KeysController],
  providers: [KeysService],
})
class PublicModule {}

export { PublicModule };
