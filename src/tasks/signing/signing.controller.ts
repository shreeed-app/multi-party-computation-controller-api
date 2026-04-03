import { BearerGuard } from "@/common/auth/bearer.guard";
import { Endpoint } from "@/common/constants/endpoint";
import {
  SigningRequestDto,
  type SigningResponseDto,
} from "@/tasks/signing/signing.dto";
import { SigningService } from "@/tasks/signing/signing.service";
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
 * HTTP controller for threshold-signature operations.
 *
 * Exposes a single `POST /signing` endpoint that enqueues a signing job and
 * returns a job identifier immediately (202 Accepted). The client polls `GET
 * /jobs/:jobId` to track the outcome and retrieve the final signature.
 *
 * All endpoints are protected by {@link BearerGuard}.
 */
@ApiTags("Signing")
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller(Endpoint.SIGNING)
class SigningController {
  constructor(private readonly signingService: SigningService) {}

  /**
   * Enqueues a threshold-signature job.
   *
   * @param {SigningRequestDto} dto - Validated request body containing the key
   *   identifier and message.
   * @returns {Promise<SigningResponseDto>} The job identifier for status
   *   polling.
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Enqueue a threshold-signature job." })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: "Job enqueued successfully.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized.",
  })
  async enqueueSigning(
    @Body() dto: SigningRequestDto,
  ): Promise<SigningResponseDto> {
    return this.signingService.enqueue(dto);
  }
}

export { SigningController };
