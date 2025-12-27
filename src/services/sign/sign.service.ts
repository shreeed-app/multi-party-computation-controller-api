import { Injectable } from "@nestjs/common";

import {
  type FinalSignature,
  type PartialSignInput,
  type PartialSignature,
} from "@/services/sign/sign.types";

@Injectable()
class SignService {
  /**
   * Generates a partial signature based on the provided input.
   *
   * @param {PartialSignInput} input - The input data for generating the
   *   partial signature.
   * @returns {PartialSignature} The generated partial signature.
   */
  public partialSign(input: PartialSignInput): PartialSignature {
    throw new Error("Method not implemented.");
  }

  /**
   * Aggregates multiple partial signatures into a final signature.
   *
   * @param {PartialSignature[]} partials - The array of partial signatures to
   *   aggregate.
   * @returns {FinalSignature} The aggregated final signature.
   */
  public aggregate(partials: PartialSignature[]): FinalSignature {
    throw new Error("Method not implemented.");
  }
}

export { SignService };
