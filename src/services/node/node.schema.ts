import { z } from "zod";

const NodeSchema = z.object({
  name: z.string().min(1),
  vault: z.object({
    host: z.string().min(1),
    port: z.number().int().min(1).max(65535),
  }),
});

const NodesListSchema = z.array(NodeSchema);

type NodeInfo = z.infer<typeof NodeSchema>;

export { NodeSchema, NodesListSchema, type NodeInfo };
