import {
  CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { type AppConfigService } from "@/common/config/config.service";
import Header from "@/common/constants/header";
import Message from "@/common/constants/message";

/**
 * Guard that allows access only to requests authenticated via mTLS with the
 * configured signer client certificate.
 */
@Injectable()
class MtlsGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const headers: Headers = request.headers;
    // Get client common name and fingerprint from headers.
    const commonName: string | null = headers.get(Header.CLIENT_COMMON_NAME);
    const fingerprint: string | null = headers.get(Header.CLIENT_FINGERPRINT);

    if (!commonName || !fingerprint)
      throw new UnauthorizedException(Message.MISSING_MTLS_HEADERS);
    if (commonName !== this.config.signerClientCommonName)
      throw new UnauthorizedException(Message.INVALID_CLIENT_COMMON_NAME);
    if (fingerprint !== this.config.signerCertificateFingerprint)
      throw new UnauthorizedException(Message.INVALID_CLIENT_CERTIFICATE);

    return true;
  }
}

export { MtlsGuard };
