import { Injectable, InternalServerErrorException } from "@nestjs/common";
import vault, { type client } from "node-vault";

import { AppConfigService } from "@/common/config/config.service";
import Message from "@/common/constants/message";
import AddressManager from "@/common/utils/address-manager";
import { type StoreKeyShareCommand } from "@/services/keys/keys.types";

@Injectable()
class KeysService {
  private readonly client: client;

  constructor(private readonly config: AppConfigService) {
    this.client = vault({
      endpoint: AddressManager.toAddress(
        this.config.vaultHost!,
        this.config.vaultPort!,
      ),
      token: this.config.vaultToken,
      requestOptions: { timeout: 5_000 },
    });
  }

  /**
   * Store a key share in Vault.
   *
   * @param {StoreKeyShareCommand} command The command containing the share to
   *   store.
   * @throws {InternalServerErrorException} If storing the share fails.
   */
  public async storeKeyShare(command: StoreKeyShareCommand): Promise<void> {
    try {
      await this.client.write(
        AddressManager.createPathAddress(
          "kv", // Mount point.
          "data", // KV version 2 data path segment.
          "mpc", // Application-specific path segment.
          command.chain, // Chain name.
          command.keyId, // Key identifier.
          "active", // Active share.
        ),
        {
          data: {
            threshold: command.threshold,
            share: command.share.toString("base64"),
            storedAt: new Date().toISOString(),
          },
        },
      );
    } catch (exception: unknown) {
      throw new InternalServerErrorException(Message.SHARE_STORAGE_FAILED);
    }
  }

  public async getKeyShare(keyId: string, chain: string): Promise<string> {
    try {
      const result = await this.client.read(
        AddressManager.createPathAddress(
          "kv", // Mount point.
          "data", // KV version 2 data path segment.
          "mpc", // Application-specific path segment.
          chain, // Chain name.
          keyId, // Key identifier.
          "active", // Active share.
        ),
      );

      return result.data.data.share;
    } catch (exception: unknown) {
      throw new InternalServerErrorException(Message.SHARE_RETRIEVAL_FAILED);
    }
  }
}

export { KeysService };
