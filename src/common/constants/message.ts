/**
 * Centralized human-readable message strings used across the application.
 * Keeping them here avoids duplicating text in guards, services, and
 * processors.
 */
class Message {
  /** Bearer token authentication messages. */
  public static readonly MISSING_AUTH_HEADER: string =
    "Missing Authorization header.";

  public static readonly INVALID_AUTH_SCHEME: string =
    "Authorization header must use the Bearer scheme.";

  public static readonly INVALID_BEARER_TOKEN: string =
    "Invalid Bearer token.";

  /** Job-related messages. */
  /**
   * @param {string} jobId - The identifier of the missing job.
   * @returns {string} A descriptive error message.
   */
  public static readonly JOB_NOT_FOUND = (jobId: string): string =>
    `Job '${jobId}' not found.`;

  /** Key-metadata related messages. */
  /**
   * @param {string} keyIdentifier - The identifier whose metadata was not
   *   found.
   * @returns {string} A descriptive error message.
   */
  public static readonly KEY_METADATA_NOT_FOUND = (
    keyIdentifier: string,
  ): string =>
    `Key metadata for '${keyIdentifier}' not found. ` +
    `Complete a key-generation operation before signing.`;

  /** Engine error messages. */
  /**
   * Formats a gRPC error from the Rust controller engine into a readable
   * string.
   *
   * @param {number} code - GRPC status code (numeric).
   * @param {string} detail - Error message returned by the engine.
   * @returns {string} Formatted error string stored in the job's
   *   `failedReason`.
   */
  public static readonly ENGINE_ERROR = (
    code: number,
    detail: string,
  ): string => `Engine error [${code}]: ${detail}`;

  public static readonly EMPTY_SIGNATURE_RESULT: string =
    "Engine returned an empty signature result.";
}

export { Message };
