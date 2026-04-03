import { AppConfigService } from "@/common/config/config.service";
import { AuthScheme, Header } from "@/common/constants/header";
import { Message } from "@/common/constants/message";
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "crypto";

/**
 * HTTP guard that validates the `Authorization: Bearer <token>` header on
 * every incoming request.
 *
 * The comparison is performed in constant time via {@link timingSafeEqual} to
 * mitigate timing-based token enumeration attacks.
 *
 * MTLS between the upstream NGINX reverse proxy and the client is handled
 * entirely by NGINX; this guard only validates the application-level token.
 */
@Injectable()
class BearerGuard implements CanActivate {
  private readonly logger: Logger = new Logger(BearerGuard.name);

  constructor(private readonly configService: AppConfigService) {}

  /**
   * Returns `true` when the request carries a valid Bearer token, otherwise
   * throws {@link UnauthorizedException}.
   *
   * @param {ExecutionContext} context - NestJS execution context providing
   *   access to the HTTP request.
   * @returns {boolean} `true` if authentication succeeds.
   * @throws {UnauthorizedException} If the header is missing, malformed, or
   *   the token is invalid.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined> | Headers;
    }>();
    // Support both Express (plain object) and Fetch API (Headers instance).
    const rawHeaders = request.headers;
    const authorizationHeader: string | null =
      typeof (rawHeaders as Headers).get === "function"
        ? (rawHeaders as Headers).get(Header.AUTHORIZATION)
        : ((rawHeaders as Record<string, string | undefined>)[
            Header.AUTHORIZATION
          ] ?? null);

    if (!authorizationHeader) {
      this.logger.warn("Rejected request: missing Authorization header.");
      throw new UnauthorizedException(Message.MISSING_AUTH_HEADER);
    }

    const [scheme, token]: string[] = authorizationHeader.split(" ");

    if (scheme?.toLowerCase() !== AuthScheme.BEARER || !token) {
      this.logger.warn("Rejected request: invalid Authorization scheme.");
      throw new UnauthorizedException(Message.INVALID_AUTH_SCHEME);
    }

    const expectedToken: string = this.configService.clientBearerToken;

    // Prevent token length from leaking information.
    if (token.length !== expectedToken.length) {
      this.logger.warn("Rejected request: invalid Bearer token.");
      throw new UnauthorizedException(Message.INVALID_BEARER_TOKEN);
    }

    const tokenBuffer: Buffer = Buffer.from(token);
    const expectedBuffer: Buffer = Buffer.from(expectedToken);

    if (!timingSafeEqual(tokenBuffer, expectedBuffer)) {
      this.logger.warn("Rejected request: invalid Bearer token.");
      throw new UnauthorizedException(Message.INVALID_BEARER_TOKEN);
    }

    return true;
  }
}

export { BearerGuard };
