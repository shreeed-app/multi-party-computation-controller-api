import { Module } from "@nestjs/common";

import ConfigKeySchema from "@/common/config/config.keys";
import { AppConfigModule } from "@/common/config/config.module";
import Mode from "@/common/constants/mode";
import { InternalModule } from "@/private/private.module";
import { PublicModule } from "@/public/public.module";
import { KeysModule } from "@/services/key/keys.module";
import { NodesModule } from "@/services/node/node.module";

const mode: Mode | undefined = process.env[
  ConfigKeySchema.APPLICATION_MODE
] as Mode | undefined;

@Module({
  imports: [
    AppConfigModule,
    ...(mode === Mode.Bootstrap ? [PublicModule, NodesModule] : []),
    ...(mode === Mode.Peer ? [InternalModule, KeysModule] : []),
  ],
})
class AppModule { }

export { AppModule };
