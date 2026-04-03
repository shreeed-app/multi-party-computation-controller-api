import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { KeyGenerationProcessor } from "@/queue/key-generation.processor";
import { QueueName } from "@/queue/queue.constants";
import { KeyGenerationController } from "@/tasks/key-generation/key-generation.controller";
import { KeyGenerationService } from "@/tasks/key-generation/key-generation.service";

/**
 * Feature module for distributed key generation.
 *
 * Owns both the HTTP layer (controller + service) and the background
 * processing layer (processor) for key-generation operations.
 *
 * Dependencies on `GrpcService` and `MetadataService` are satisfied
 * globally via their respective `@Global()` modules.
 */
@Module({
  imports: [BullModule.registerQueue({ name: QueueName.KEY_GENERATION })],
  controllers: [KeyGenerationController],
  providers: [KeyGenerationService, KeyGenerationProcessor],
})
class KeyGenerationModule {}

export { KeyGenerationModule };
