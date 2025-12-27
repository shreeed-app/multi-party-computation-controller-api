const ConfigKeySchema = {
  NODE_ENV: "NODE_ENV",
  APPLICATION_MODE: "APPLICATION_MODE",
  PORT: "PORT",
  // Bootstrap mode keys.
  SIGNER_CLIENT_COMMON_NAME: "SIGNER_CLIENT_COMMON_NAME",
  SIGNER_CERTIFICATE_FINGERPRINT: "SIGNER_CERTIFICATE_FINGERPRINT",
  NODES_CONFIG_PATH: "NODES_CONFIG_PATH",
  NODES: "NODES", // Not present in .env file.
  // Peer mode keys.
  VAULT_HOST: "VAULT_HOST",
  VAULT_PORT: "VAULT_PORT",
  VAULT_TOKEN: "VAULT_TOKEN",
} as const;

type ConfigKey = (typeof ConfigKeySchema)[keyof typeof ConfigKeySchema];

export default ConfigKeySchema;
export { ConfigKeySchema, type ConfigKey };
