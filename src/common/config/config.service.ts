import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AppConfig } from "@/app.config";
import { ConfigKeySchema } from "@/common/config/config.keys";
import Mode from "@/common/constants/mode";
import { NodeInfo } from "@/services/node/node.types";

@Injectable()
class AppConfigService {
  constructor(private readonly config: ConfigService<AppConfig>) {}

  /**
   * Get the signer client common name from the configuration.
   *
   * @returns {string | undefined} The signer client common name, if set.
   */
  public get signerClientCommonName(): string | undefined {
    return this.config.get<string | undefined>(
      ConfigKeySchema.SIGNER_CLIENT_COMMON_NAME,
      {
        infer: true,
      },
    );
  }

  /**
   * Get the signer certificate fingerprint from the configuration.
   *
   * @returns {string | undefined} The signer certificate fingerprint, if set.
   */
  public get signerCertificateFingerprint(): string | undefined {
    return this.config.get<string | undefined>(
      ConfigKeySchema.SIGNER_CERTIFICATE_FINGERPRINT,
      {
        infer: true,
      },
    );
  }

  /**
   * Get the application mode from the configuration.
   *
   * @returns {typeof Mode} The application mode.
   */
  public get appMode(): typeof Mode {
    return this.config.get<typeof Mode>(ConfigKeySchema.APPLICATION_MODE, {
      infer: true,
    });
  }

  /**
   * Get the nodes configuration from the configuration.
   *
   * @returns {readonly NodeInfo[]} The nodes configuration.
   */
  public get nodes(): readonly NodeInfo[] {
    return (
      this.config.get<NodeInfo[] | undefined>(ConfigKeySchema.NODES, {
        infer: true,
      }) ?? []
    );
  }

  /**
   * Get the Vault host from the configuration.
   *
   * @returns {string | undefined} The Vault host.
   */
  public get vaultHost(): string | undefined {
    return this.config.get<string>(ConfigKeySchema.VAULT_HOST, {
      infer: true,
    });
  }

  /**
   * Get the Vault port from the configuration.
   *
   * @returns {number | undefined} The Vault port.
   */
  public get vaultPort(): number | undefined {
    return this.config.get<number>(ConfigKeySchema.VAULT_PORT, {
      infer: true,
    });
  }

  /**
   * Get the Vault token from the configuration.
   *
   * @returns {string | undefined} The Vault token.
   */
  public get vaultToken(): string | undefined {
    return this.config.get<string>(ConfigKeySchema.VAULT_TOKEN, {
      infer: true,
    });
  }
}

export { AppConfigService };
