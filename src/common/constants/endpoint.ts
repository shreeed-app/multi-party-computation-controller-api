/**
 * HTTP route prefix constants. Declared here so that controllers and tests
 * reference a single source of truth rather than duplicating literal strings.
 */
class Endpoint {
  /** Route prefix for distributed key-generation operations. */
  public static readonly KEY_GENERATION = "/key-generation";

  /** Route prefix for threshold-signature operations. */
  public static readonly SIGNING = "/signing";

  /** Route prefix for job-status polling. */
  public static readonly JOBS = "/jobs";
}

export { Endpoint };
