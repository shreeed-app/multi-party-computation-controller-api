/** Endpoints constants of the application APIs. */
class Endpoint {
  // Public API endpoints.
  public static readonly KEYS = "/v1/keys";

  // Internal/private API endpoints.
  public static readonly INTERNAL_KEYS = "/internal/keys";
  public static readonly INTERNAL_KEYS_SHARE = Endpoint.combine(
    Endpoint.INTERNAL_KEYS,
    "share",
  );
  public static readonly INTERNAL_SIGN = "/internal/sign";

  /**
   * Combines multiple endpoint segments into a single endpoint string.
   *
   * @param {...string[]} endpoints - The endpoint segments to combine.
   * @returns {string} The combined endpoint string.
   */
  public static combine(...endpoints: string[]): string {
    return endpoints.join("/");
  }

  /**
   * Retrieves the last segment of a given endpoint.
   *
   * @param {string} endpoint - The endpoint string.
   * @returns {string} The last segment of the endpoint.
   */
  public static lastSegment(endpoint: string): string {
    const segments: string[] = endpoint.split("/");
    return segments[segments.length - 1];
  }
}

export default Endpoint;
export { Endpoint };
