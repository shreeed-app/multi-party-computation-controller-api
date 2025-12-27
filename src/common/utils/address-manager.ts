/** Utility class for managing and formatting addresses. */
class AddressManager {
  /**
   * Convert a host and port into an address string.
   *
   * @param {string} host - The host name or IP address.
   * @param {number} port - The port number.
   * @returns {string} The combined address in the format "host:port".
   */
  public static toAddress(host: string, port: number): string {
    return `${host}:${port}`;
  }

  /**
   * Create a path address by joining multiple path segments.
   *
   * @param {...string[]} path - The path segments to join.
   * @returns {string} The joined path address.
   */
  public static createPathAddress(...path: string[]): string {
    return path.join("/");
  }
}

export default AddressManager;
export { AddressManager };
