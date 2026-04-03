import { join } from "path";

/**
 * NestJS injection token for the `ClientGrpc` instance that wraps the Rust
 * controller engine connection.
 */
const GRPC_CLIENT_TOKEN = "CONTROLLER_ENGINE" as const;

/**
 * Protobuf package name as declared in `engine.proto`. Must match the
 * `package` directive exactly.
 */
const GRPC_PACKAGE_NAME = "engine.v1" as const;

/**
 * Name of the gRPC service within the `engine.v1` package that the NestJS
 * Worker calls. The `Node` service (used by the engine internally) is
 * intentionally not referenced here.
 */
const GRPC_SERVICE_NAME = "Controller" as const;

/**
 * Path to `engine.proto`. Relative to the current working directory, which
 * must contain a `proto/` folder (project root in dev, `/app` in Docker).
 * Proto assets are copied by the nest-cli pipeline (`assets` in nest-cli.json).
 */
const GRPC_PROTO_PATH: string = join("proto", "engine", "v1", "engine.proto");

export {
  GRPC_CLIENT_TOKEN,
  GRPC_PACKAGE_NAME,
  GRPC_PROTO_PATH,
  GRPC_SERVICE_NAME,
};
