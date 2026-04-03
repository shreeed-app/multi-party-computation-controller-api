import { Global, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { AppConfigService } from "@/common/config/config.service";
import { AddressManager } from "@/common/utils/address-manager";
import {
  GRPC_CLIENT_TOKEN,
  GRPC_PACKAGE_NAME,
  GRPC_PROTO_PATH,
} from "@/grpc/grpc.constants";
import { GrpcService } from "@/grpc/grpc.service";

/**
 * Global gRPC module.
 *
 * Registers a `ClientGrpc` bound to the Rust controller engine and exposes
 * `GrpcService` to the entire application without requiring re-imports.
 *
 * Proto loader options:
 *
 * - `keepCase: false` — proto-loader converts `snake_case` field names to
 *   `camelCase`.
 * - `longs: Number` — 64-bit integers are decoded as JS numbers.
 * - `enums: Number` — enum values are kept as numbers (matches the `Algorithm`
 *   TS enum).
 * - `defaults: true` — missing fields are initialized to their proto default
 *   values.
 * - `oneofs: false` — oneof fields are returned as plain optional properties.
 */
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: GRPC_CLIENT_TOKEN,
        inject: [AppConfigService],
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: AddressManager.toAddress(
              configService.rustEngineHost,
              configService.rustEnginePort,
            ),
            package: GRPC_PACKAGE_NAME,
            protoPath: GRPC_PROTO_PATH,
            loader: {
              keepCase: false,
              longs: Number,
              enums: Number,
              defaults: true,
              oneofs: false,
            },
          },
        }),
      },
    ]),
  ],
  providers: [GrpcService],
  exports: [GrpcService],
})
class GrpcModule {}

export { GrpcModule };
