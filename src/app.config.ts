import { z } from "zod";

import ConfigKeySchema from "@/common/config/config.keys";
import Mode from "@/common/constants/mode";

const BaseConfig = {
  [ConfigKeySchema.APPLICATION_MODE]: z.enum(Mode),
  [ConfigKeySchema.PORT]: z.coerce.number().int().min(1).max(65535),
} as const;

// Configuration schema for Bootstrap mode.
const BootstrapConfigSchema = z.object({
  ...BaseConfig,
  [ConfigKeySchema.APPLICATION_MODE]: z.literal(Mode.Bootstrap),
  [ConfigKeySchema.SIGNER_CLIENT_COMMON_NAME]: z.string().min(1),
  [ConfigKeySchema.SIGNER_CERTIFICATE_FINGERPRINT]: z
    .string()
    .min(10)
    .optional(),
  [ConfigKeySchema.NODES_CONFIG_PATH]: z.string().min(1),
});

// Configuration schema for Peer mode.
const PeerConfigSchema = z.object({
  ...BaseConfig,
  [ConfigKeySchema.APPLICATION_MODE]: z.literal(Mode.Peer),
  [ConfigKeySchema.VAULT_HOST]: z.string().min(1),
  [ConfigKeySchema.VAULT_PORT]: z.coerce.number().int().min(1).max(65535),
  [ConfigKeySchema.VAULT_TOKEN]: z.string().min(8),
});

// Select the appropriate configuration schema based on APPLICATION_MODE.
const AppConfigSchema = z.discriminatedUnion(
  ConfigKeySchema.APPLICATION_MODE,
  [BootstrapConfigSchema, PeerConfigSchema],
);

type AppConfig = z.infer<typeof AppConfigSchema>;

export default AppConfigSchema;
export { AppConfigSchema, type AppConfig };
