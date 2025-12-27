import { readFileSync } from "fs";

import ConfigKeySchema from "@/common/config/config.keys";
import { NodeInfo, NodesListSchema } from "@/services/node/node.schema";

/**
 * Load and parse the nodes configuration from the file specified in the
 * NODES_CONFIG_PATH environment variable.
 *
 * @returns {{ nodes: NodeInfo[] }} The parsed nodes configuration.
 * @throws {Error} If the NODES_CONFIG_PATH is not set or if the file cannot be
 *   read or parsed.
 */
const loadNodesConfig = (): { nodes: NodeInfo[] } => {
  const key: string = ConfigKeySchema.NODES_CONFIG_PATH;
  const path: string = process.env[key as keyof typeof process.env] || "";
  if (!path) throw new Error(`'${key}' is required.`);

  const raw: string = readFileSync(path, "utf-8");
  return { nodes: NodesListSchema.parse(JSON.parse(raw)) };
};

export default loadNodesConfig;
export { loadNodesConfig };
