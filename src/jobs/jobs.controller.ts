import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { BearerGuard } from "@/common/auth/bearer.guard";
import { Endpoint } from "@/common/constants/endpoint";
import { JobsService } from "@/jobs/jobs.service";
import { type JobStatusResponse } from "@/jobs/jobs.types";

/**
 * HTTP controller for job-status polling.
 *
 * Exposes a single `GET /jobs/:jobId` endpoint that returns the current state
 * of an enqueued key-generation or signing job.
 *
 * Clients should poll this endpoint after receiving a 202 Accepted response
 * from `POST /key-generation` or `POST /signing` until `status` is `completed`
 * or `failed`.
 *
 * All endpoints are protected by {@link BearerGuard}.
 */
@UseGuards(BearerGuard)
@Controller(Endpoint.JOBS)
class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * Returns the current status of a job.
   *
   * @param {string} jobId - The UUID returned when the job was enqueued.
   * @returns {Promise<JobStatusResponse>} A snapshot of the job's state,
   *   result, or error.
   */
  @Get(":jobId")
  async getJobStatus(
    @Param("jobId") jobId: string,
  ): Promise<JobStatusResponse> {
    return this.jobsService.getJobStatus(jobId);
  }
}

export { JobsController };
