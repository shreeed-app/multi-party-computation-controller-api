import { Injectable } from "@nestjs/common";

import { StoreShareDto } from "@/private/keys/keys.dto";
import { KeysService } from "@/services/keys/keys.service";

@Injectable()
class NodeKeysService {
  constructor(private readonly keysService: KeysService) {}
  /**
   * Store a key share in Vault.
   *
   * @param {StoreShareDto} dto - Data transfer object containing key share
   *   information.
   * @returns {Promise<void>} A promise that resolves when the key share is
   *   stored.
   */
  public async storeShare(dto: StoreShareDto): Promise<void> {
    // Decode share from base64 to Buffer abd store the key share in Vault.
    await this.keysService.storeKeyShare({
      ...dto,
      share: Buffer.from(dto.share, "base64"),
    });
  }
}

export { NodeKeysService };
