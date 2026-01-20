jest.mock("@/services/node/node.loader", () => ({
  loadNodesConfig: () => ({
    nodes: [],
  }),
}));

jest.mock("@/common/config/config.validation", () => ({
  validate: jest.fn((env: Record<string, unknown>) => env as any),
}));
