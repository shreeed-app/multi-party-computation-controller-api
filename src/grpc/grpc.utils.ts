import { Message } from "@/common/constants/message";

export type GrpcError = Error & { code?: number };

/**
 * Converts a raw gRPC error into a formatted `Error` with a human-readable
 * message.
 *
 * GRPC errors from `@grpc/grpc-js` are `Error` instances augmented with a
 * numeric `code` property (the gRPC status code). When that property is
 * present, the code is included in the error message to ease diagnostics.
 *
 * @param {unknown} error - The raw caught value from a failed gRPC call.
 * @returns {Error} A properly formatted `Error` suitable for BullMQ's
 *   `failedReason`.
 */
const formatGrpcError = (error: unknown): Error => {
  if (error instanceof Error) {
    const grpcCode: number | undefined = (error as GrpcError).code;
    if (grpcCode !== undefined) {
      return new Error(Message.ENGINE_ERROR(grpcCode, error.message));
    }
    return error;
  }
  return new Error(Message.ENGINE_ERROR(-1, "Unknown error"));
};

export { formatGrpcError };
