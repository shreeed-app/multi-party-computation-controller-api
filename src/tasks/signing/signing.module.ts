import { QueueName } from "@/queue/queue.constants";
import { SigningProcessor } from "@/queue/signing.processor";
import { SigningController } from "@/tasks/signing/signing.controller";
import { SigningService } from "@/tasks/signing/signing.service";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

/**
 * Feature module for threshold-signature operations.
 *
 * Owns both the HTTP layer (controller + service) and the background
 * processing layer (processor) for signing operations.
 *
 * Dependencies on `GrpcService` and `MetadataService` are satisfied globally
 * via their respective `@Global()` modules.
 */
@Module({
  imports: [BullModule.registerQueue({ name: QueueName.SIGNING })],
  controllers: [SigningController],
  providers: [SigningService, SigningProcessor],
})
class SigningModule {}

export { SigningModule };
