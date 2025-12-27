type NodeInfo = {
  name: string;
  vault: {
    host: string;
    port: number;
  };
};

type SendShareCommand = {
  nodeName: string;
  keyId: string;
  chain: string;
  share: string;
  threshold: number;
};

export { type NodeInfo, type SendShareCommand };
