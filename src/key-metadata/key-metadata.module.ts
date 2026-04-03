import { Global, Module } from "@nestjs/common";

import { KeyMetadataService } from "@/key-metadata/key-metadata.service";

/**
 * Global key-metadata module.
 *
 * Makes `KeyMetadataService` available to all modules — specifically the
 * keygen and sign processors — without requiring per-module imports.
 */
@Global()
@Module({
  providers: [KeyMetadataService],
  exports: [KeyMetadataService],
})
class KeyMetadataModule {}

export { KeyMetadataModule };
