import { JobsController } from "@/jobs/jobs.controller";
import { JobsService } from "@/jobs/jobs.service";
import { QueueName } from "@/queue/queue.constants";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

/**
 * Feature module for job-status polling.
 *
 * Registers read-only access to both the `key-generation` and `signing` queues
 * so that `JobsService` can query job state without being a processor for
 * either queue.
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueName.KEY_GENERATION },
      { name: QueueName.SIGNING },
    ),
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
class JobsModule {}

export { JobsModule };
