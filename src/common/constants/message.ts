/** Messages constants used across the application. */
class Message {
  public static readonly SHARES_MISMATCH =
    "Number of shares must match number of nodes.";
  public static readonly UNKNOWN_NODE_NAME = (nodeName: string) =>
    `Unknown nodeName: '${nodeName}'.`;
  public static readonly SHARE_DISTRIBUTION_FAILED =
    "Failed to distribute shares to all nodes.";
  public static readonly SHARE_STORAGE_FAILED =
    "Failed to store key share in Vault.";
  public static readonly SHARE_RETRIEVAL_FAILED =
    "Failed to retrieve key share from Vault.";

  public static readonly MISSING_MTLS_HEADERS =
    "Missing mTLS identity headers.";
  public static readonly INVALID_CLIENT_COMMON_NAME =
    "Invalid client Common Name.";
  public static readonly INVALID_CLIENT_CERTIFICATE =
    "Invalid client certificate.";

  public static readonly SIGNING_FAILED = "Signing operation failed.";
}

export default Message;
export { Message };
