/**
 * HTTP header name constants. Lowercase per the HTTP/2 spec (which gRPC also
 * uses), safe to use for both Express `request.headers.get()` and gRPC
 * `Metadata.add()`.
 */
const Header = {
  AUTHORIZATION: "authorization",
} as const;

/** Authentication scheme identifiers for the `Authorization` header. */
const AuthScheme = {
  /** Lowercase form, used for case-insensitive scheme comparison. */
  BEARER: "bearer",
  /** Capitalized form, used when constructing header values. */
  BEARER_PREFIX: "Bearer",
  BASIC_PREFIX: "Basic",
} as const;

export { AuthScheme, Header };
