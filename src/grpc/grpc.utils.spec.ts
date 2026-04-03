import { Message } from "@/common/constants/message";
import { formatGrpcError, type GrpcError } from "@/grpc/grpc.utils";

describe("formatGrpcError", () => {
  it("Formats a gRPC Error with a numeric code property.", () => {
    const message: string = "Deadline exceeded.";
    // The canonical gRPC error shape from @grpc/grpc-js: an Error instance
    // augmented with a numeric `code` field (the gRPC status code).
    const error: GrpcError = Object.assign(new Error(message), {
      code: 4,
    });

    const result: Error = formatGrpcError(error);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(Message.ENGINE_ERROR(4, message));
  });

  it("Returns the original Error when no gRPC code property is present.", () => {
    // A plain Error (e.g. a programming error) must pass through untouched so
    // the original stack trace and message are preserved.
    const original: Error = new Error("Plain failure.");
    const result: Error = formatGrpcError(original);

    expect(result).toBe(original);
  });

  it("Wraps a non-Error thrown value with a fallback message.", () => {
    // JavaScript allows throwing any value; we must handle the string case
    // gracefully rather than crashing when accessing .message.
    const result: Error = formatGrpcError("String thrown as error.");

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(Message.ENGINE_ERROR(-1, "Unknown error"));
  });

  it("Wraps a plain object that is not an Error instance.", () => {
    // A plain object is not an instanceof Error, so the `instanceof` guard
    // catches it and falls through to the generic fallback.
    const result: Error = formatGrpcError({ code: 2, message: "object" });

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(Message.ENGINE_ERROR(-1, "Unknown error"));
  });

  it("Handles gRPC error code 0 (should not be treated as absent).", () => {
    const message: string = "OK but unexpected.";
    // Code 0 is falsy; the check must use `!== undefined` rather than `!code`
    // so that code 0 (OK — unexpected but possible) is still formatted.
    const error: GrpcError = Object.assign(new Error(message), {
      code: 0,
    });

    const result: Error = formatGrpcError(error);

    expect(result.message).toBe(Message.ENGINE_ERROR(0, message));
  });
});
