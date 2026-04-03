import { AuthScheme, Header } from "@/common/constants/header";
import { Injectable } from "@nestjs/common";
import { ThrottlerGuard as _ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";

/**
 * Rate-limiting guard that keys each throttle bucket on the combination of the
 * client IP address and Bearer token.
 *
 * Using both dimensions means:
 *
 * - Different IPs with the same token are counted separately (IP-level limit).
 * - The same IP using different tokens is also counted separately (token-level
 *   limit).
 *
 * If no token is present the key degrades gracefully to `<ip>:` so that
 * unauthenticated probing is also throttled.
 */
@Injectable()
class ThrottlerGuard extends _ThrottlerGuard {
  /**
   * Builds the throttle storage key for the incoming request.
   *
   * @param {Request} request - The raw Express request object.
   * @returns {Promise<string>} A string key of the form `<ip>:<token>`.
   */
  protected override async getTracker(request: Request): Promise<string> {
    const ip: string = request.ip ?? request.socket?.remoteAddress ?? "";
    const authHeader: string = request.headers?.[Header.AUTHORIZATION] ?? "";
    const token: string = authHeader.startsWith(AuthScheme.BEARER_PREFIX)
      ? authHeader.slice(7)
      : "";
    return `${ip}:${token}`;
  }
}

export { ThrottlerGuard as IpBearerThrottlerGuard };
