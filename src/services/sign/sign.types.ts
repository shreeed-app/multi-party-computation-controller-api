type PartialSignInput = {
  chain: string;
  digest: string;
  share: string;
};

type PartialSignature = {
  signature: string;
};

type FinalSignature = {
  signature: string;
};

export { type FinalSignature, type PartialSignature, type PartialSignInput };
