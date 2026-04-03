import { BearerGuard } from "@/common/auth/bearer.guard";
import { Endpoint } from "@/common/constants/endpoint";
import {
  KeyGenerationRequestDto,
  type KeyGenerationResponseDto,
} from "@/tasks/key-generation/key-generation.dto";
import { KeyGenerationService } from "@/tasks/key-generation/key-generation.service";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

/**
 * HTTP controller for distributed key-generation operations.
 *
 * Exposes a single `POST /key-generation` endpoint that enqueues a
 * key-generation job and returns a job identifier immediately (202 Accepted).
 * The client polls `GET /jobs/:jobId` to track the outcome.
 *
 * All endpoints are protected by {@link BearerGuard}.
 */
@ApiTags("Key generation")
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller(Endpoint.KEY_GENERATION)
class KeyGenerationController {
  constructor(private readonly keyGenerationService: KeyGenerationService) {}

  /**
   * Enqueues a distributed key-generation job.
   *
   * @param {KeyGenerationRequestDto} dto - Validated request body containing
   *   key parameters.
   * @returns {Promise<KeyGenerationResponseDto>} The job identifier for status
   *   polling.
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Enqueue a distributed key-generation job." })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: "Job enqueued successfully.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized.",
  })
  async enqueueKeyGeneration(
    @Body() dto: KeyGenerationRequestDto,
  ): Promise<KeyGenerationResponseDto> {
    return this.keyGenerationService.enqueue(dto);
  }
}

export { KeyGenerationController };
