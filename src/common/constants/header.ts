/** Headers constants used in HTTP requests and responses. */
class Header {
  // Header for client common name.
  public static readonly CLIENT_COMMON_NAME = "x-client-cn";
  // Header for client certificate fingerprint.
  public static readonly CLIENT_FINGERPRINT = "x-client-fingerprint";
}

export default Header;
export { Header };
