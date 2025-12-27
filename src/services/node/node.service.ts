import { HttpService } from "@nestjs/axios";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";

import { AppConfigService } from "@/common/config/config.service";
import Endpoint from "@/common/constants/endpoint";
import Message from "@/common/constants/message";
import AllSettled from "@/common/utils/all-settled";
import { NodeInfo, SendShareCommand } from "@/services/node/node.types";

import { SignDigestDto } from "../sign/sign.dto";
import { PartialSignature } from "../sign/sign.types";

@Injectable()
class NodesService {
  constructor(
    private readonly http: HttpService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Sends a key share to a specific node.
   *
   * @param {SendShareCommand} command - The command containing share details.
   * @throws {NotFoundException} If the specified node ID does not exist.
   */
  public async sendShareToNode(command: SendShareCommand): Promise<void> {
    const node: NodeInfo | undefined = this.config.nodes?.find(
      (node: NodeInfo) => node.name === command.nodeName,
    );

    if (!node)
      throw new NotFoundException(Message.UNKNOWN_NODE_NAME(command.nodeName));
    await firstValueFrom(
      this.http.post(
        `${node.vault.host}:${node.vault.port}${Endpoint.INTERNAL_KEYS_SHARE}`,
        command,
        { timeout: 5_000 },
      ),
    );
  }

  /**
   * Requests partial signatures from all configured nodes.
   *
   * @param {SignDigestDto} dto - The data transfer object containing the
   *   digest to be signed.
   * @returns {Promise<AllSettled<PartialSignature>>} A promise that resolves
   *   to an AllSettled instance containing the results of the partial
   *   signature requests.
   */
  public async requestPartialSignatures(
    dto: SignDigestDto,
  ): Promise<AllSettled<PartialSignature>> {
    return await AllSettled.from(
      this.config.nodes.map((node: NodeInfo) =>
        firstValueFrom(
          this.http.post<PartialSignature>(
            `${node.vault.host}:${node.vault.port}${Endpoint.INTERNAL_SIGN}`,
            dto,
            { timeout: 5_000 },
          ),
        ).then((result: AxiosResponse<PartialSignature>) => result.data),
      ),
    );
  }
}

export { NodesService };
