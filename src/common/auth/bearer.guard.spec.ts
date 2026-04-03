import { BearerGuard } from "@/common/auth/bearer.guard";
import { AppConfigService } from "@/common/config/config.service";
import { AuthScheme, Header } from "@/common/constants/header";
import { Message } from "@/common/constants/message";
import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { randomBytes } from "crypto";

// A valid 64-char hex token (32 random bytes). The exact value is
// irrelevant; what matters is that the guard treats it as the expected token.
const VALID_TOKEN: string = randomBytes(32).toString("hex");

/**
 * Factory function to create a mock `AppConfigService` with a specified
 * `clientBearerToken` value.
 *
 * @param {string} token - The Bearer token to return from the mock config
 *   service. Defaults to a valid token for successful authentication tests.
 * @returns {AppConfigService} A mock config service instance with the given
 *   token set as `clientBearerToken`. The other config values are irrelevant
 *   for these tests and can be left undefined.
 */
const makeConfigService = (token: string = VALID_TOKEN): AppConfigService => {
  return { clientBearerToken: token } as unknown as AppConfigService;
};

/**
 * Helper function to create a mock `ExecutionContext` with a specified
 * `Authorization` header value.
 *
 * @param {string | null} authHeader - The value to return from the mock
 *   request's `Authorization` header. If `null`, the header will be absent.
 * @returns {ExecutionContext} A mock execution context that provides a request
 *   object with the specified `Authorization` header when switched to HTTP
 *   context.
 */
const makeContext = (authHeader: string | null): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          get: (name: string) =>
            name === Header.AUTHORIZATION ? authHeader : null,
        },
      }),
    }),
  } as ExecutionContext;
};

describe("BearerGuard", () => {
  let guard: BearerGuard;

  beforeEach(() => {
    // Default guard instance configured with VALID_TOKEN as the expected
    // token; individual tests override this via makeConfigService() when
    // testing rejection paths.
    guard = new BearerGuard(makeConfigService());
  });

  it("Returns true for a valid Bearer token.", () => {
    // The header must match the expected scheme AND the exact token bytes.
    expect(
      guard.canActivate(
        makeContext(`${AuthScheme.BEARER_PREFIX} ${VALID_TOKEN}`),
      ),
    ).toBe(true);
  });

  it("Throws when the Authorization header is absent.", () => {
    // A null header means the request arrived with no Authorization header.
    expect(() => guard.canActivate(makeContext(null))).toThrow(
      new UnauthorizedException(Message.MISSING_AUTH_HEADER),
    );
  });

  it("Throws when the scheme is not Bearer.", () => {
    // Any scheme other than Bearer (e.g. Basic) must be rejected immediately
    // before performing any token comparison.
    expect(() =>
      guard.canActivate(
        makeContext(`${AuthScheme.BASIC_PREFIX} ${VALID_TOKEN}`),
      ),
    ).toThrow(new UnauthorizedException(Message.INVALID_AUTH_SCHEME));
  });

  it("Throws when only the scheme is present with no token.", () => {
    // Splitting "Bearer" on a space yields ["Bearer", undefined]; the guard
    // must reject this as a malformed header rather than comparing undefined.
    expect(() =>
      guard.canActivate(makeContext(AuthScheme.BEARER_PREFIX)),
    ).toThrow(new UnauthorizedException(Message.INVALID_AUTH_SCHEME));
  });

  it("Throws when the token length differs (prevents timing leak).", () => {
    // TimingSafeEqual requires equal-length buffers. The guard rejects on
    // length mismatch before calling timingSafeEqual to avoid a panic.
    expect(() =>
      guard.canActivate(makeContext(`${AuthScheme.BEARER_PREFIX} short.`)),
    ).toThrow(new UnauthorizedException(Message.INVALID_BEARER_TOKEN));
  });

  it("Throws when the token has the same length but a different value.", () => {
    // RandomBytes(n).toString("hex") always produces 2n characters, so
    // divide by 2 to match the length of VALID_TOKEN (64 chars = 32 bytes).
    // This exercises the timingSafeEqual constant-time comparison path.
    const wrongToken: string = randomBytes(VALID_TOKEN.length / 2).toString(
      "hex",
    );
    expect(() =>
      guard.canActivate(
        makeContext(`${AuthScheme.BEARER_PREFIX} ${wrongToken}`),
      ),
    ).toThrow(new UnauthorizedException(Message.INVALID_BEARER_TOKEN));
  });
});
