import { Module } from "@nestjs/common";

import { AppConfigModule } from "@/common/config/config.module";
import { KeysService } from "@/services/keys/keys.service";

@Module({
  imports: [AppConfigModule],
  providers: [KeysService],
  exports: [KeysService],
})
class KeysModule {}

export { KeysModule };
