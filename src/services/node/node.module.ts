import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { AppConfigModule } from "@/common/config/config.module";
import { NodesService } from "@/services/node/node.service";

@Module({
  imports: [HttpModule, AppConfigModule],
  providers: [NodesService],
  exports: [NodesService],
})
class NodesModule {}

export { NodesModule };
