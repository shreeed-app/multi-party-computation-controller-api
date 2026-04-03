import { BearerGuard } from "@/common/auth/bearer.guard";
import { Endpoint } from "@/common/constants/endpoint";
import { JobsService } from "@/jobs/jobs.service";
import { type JobStatusResponse } from "@/jobs/jobs.types";
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

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
@ApiTags("Jobs")
@ApiBearerAuth()
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
  @ApiOperation({ summary: "Get the status of a job." })
  @ApiResponse({ status: HttpStatus.OK, description: "Job status retrieved." })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized.",
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Job not found." })
  async getJobStatus(
    @Param("jobId", new ParseUUIDPipe()) jobId: string,
  ): Promise<JobStatusResponse> {
    return this.jobsService.getJobStatus(jobId);
  }
}

export { JobsController };
