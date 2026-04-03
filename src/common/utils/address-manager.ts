/** Utility class for building address strings. */
class AddressManager {
  /**
   * Combines a host and a port into a `host:port` address string.
   *
   * @param {string} host - Hostname or IP address.
   * @param {number} port - Port number.
   * @returns {string} The combined address in `"host:port"` format.
   */
  public static toAddress(host: string, port: number): string {
    return `${host}:${port}`;
  }
}

export { AddressManager };
