import { AppConfigService } from "@/common/config/config.service";
import { AuthScheme, Header } from "@/common/constants/header";
import { GRPC_CLIENT_TOKEN, GRPC_SERVICE_NAME } from "@/grpc/grpc.constants";
import {
  type AbortRequest,
  type ControllerClient,
  type GenerateKeyRequest,
  type GenerateKeyResponse,
  type SignRequest,
  type SignResponse,
} from "@/grpc/grpc.types";
import { formatGrpcError } from "@/grpc/grpc.utils";
import { Metadata } from "@grpc/grpc-js";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { type ClientGrpc } from "@nestjs/microservices";
import { ResultAsync } from "neverthrow";
import { firstValueFrom } from "rxjs";

/**
 * Client service for the Rust controller engine gRPC `Controller` service.
 *
 * Every outbound call attaches an `Authorization: Bearer` metadata entry so
 * the engine can authenticate the request. The Bearer token is read once from
 * `AppConfigService` and injected per-call.
 *
 * The underlying gRPC channel is created and managed by NestJS
 * `ClientsModule`; this service is responsible only for the application-level
 * mapping between NestJS method calls and Observable-based gRPC stubs.
 */
@Injectable()
class GrpcService implements OnModuleInit {
  private controllerClient!: ControllerClient;

  constructor(
    @Inject(GRPC_CLIENT_TOKEN)
    private readonly grpcClient: ClientGrpc,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Initialises the typed `Controller` service stub after the module's
   * dependencies have been resolved.
   */
  onModuleInit(): void {
    this.controllerClient =
      this.grpcClient.getService<ControllerClient>(GRPC_SERVICE_NAME);
  }

  /**
   * Builds a gRPC `Metadata` object containing the engine Bearer token. Called
   * on every outbound RPC so the token is always fresh from config.
   *
   * @returns {Metadata} A populated {@link Metadata} instance.
   */
  private buildAuthMetadata(): Metadata {
    const metadata = new Metadata();
    metadata.add(
      Header.AUTHORIZATION,
      `${AuthScheme.BEARER_PREFIX} ${this.configService.rustEngineBearerToken}`,
    );
    return metadata;
  }

  /**
   * Calls the `GenerateKey` RPC on the Rust controller engine.
   *
   * The call blocks until the distributed key-generation protocol completes on
   * all nodes. CGGMP24 may take up to several tens of seconds.
   *
   * @param {GenerateKeyRequest} request - Key-generation parameters forwarded
   *   to the engine.
   * @returns {Promise<GenerateKeyResponse>} The canonical public key and the
   *   opaque public-key package.
   * @throws The underlying gRPC `StatusObject` on transport or engine errors.
   */
  generateKey(
    request: GenerateKeyRequest,
  ): ResultAsync<GenerateKeyResponse, Error> {
    return ResultAsync.fromPromise(
      firstValueFrom(
        this.controllerClient.generateKey(request, this.buildAuthMetadata()),
      ),
      formatGrpcError,
    );
  }

  /**
   * Calls the `Sign` RPC on the cryptographic engine.
   *
   * @param {SignRequest} request - Signing parameters including the opaque
   *   public-key package.
   * @returns {ResultAsync<SignResponse, Error>} The raw or ECDSA signature
   *   produced by the threshold protocol, or a formatted engine error.
   */
  sign(request: SignRequest): ResultAsync<SignResponse, Error> {
    return ResultAsync.fromPromise(
      firstValueFrom(
        this.controllerClient.sign(request, this.buildAuthMetadata()),
      ),
      formatGrpcError,
    );
  }

  /**
   * Calls the `Abort` RPC to cancel an in-progress protocol session.
   *
   * @param {AbortRequest} request - Contains the UUID of the session to abort.
   * @returns {ResultAsync<void, Error>} Ok on success, or a formatted engine
   *   error if the session is not found.
   */
  abort(request: AbortRequest): ResultAsync<void, Error> {
    return ResultAsync.fromPromise(
      firstValueFrom(
        this.controllerClient.abort(request, this.buildAuthMetadata()),
      ).then(() => undefined),
      formatGrpcError,
    );
  }
}

export { GrpcService };
