import { Global, Module } from "@nestjs/common";

import { MetadataService } from "@/metadata/metadata.service";

/**
 * Global metadata module.
 *
 * Makes `MetadataService` available to all modules — specifically the key
 * generation and sign processors — without requiring per-module imports.
 */
@Global()
@Module({
  providers: [MetadataService],
  exports: [MetadataService],
})
class MetadataModule {}

export { MetadataModule };
