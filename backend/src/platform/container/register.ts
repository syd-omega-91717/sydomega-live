// ============================================================================
// FILE: /backend/src/platform/container/register.ts
// NEW FILE
// ============================================================================

import container from "./container.js";

import logger from "../observability/logger.js";
import metrics from "../observability/metrics.js";
import tracing from "../observability/tracing.js";
import health from "../observability/health.js";

import jwtService from "../../security/authentication/jwt.service.js";
import sessionService from "../../security/authentication/session.service.js";
import refreshTokenService from "../../security/authentication/refreshToken.service.js";

import passwordService from "../../security/cryptography/password.service.js";
import encryptionService from "../../security/cryptography/encryption.service.js";
import hashingService from "../../security/cryptography/hashing.service.js";

export function registerContainer(): void {

    container.singleton(

        "Logger",

        () => logger

    );

    container.singleton(

        "Metrics",

        () => metrics

    );

    container.singleton(

        "Tracing",

        () => tracing

    );

    container.singleton(

        "Health",

        () => health

    );

    container.singleton(

        "JwtService",

        () => jwtService

    );

    container.singleton(

        "SessionService",

        () => sessionService

    );

    container.singleton(

        "RefreshTokenService",

        () => refreshTokenService

    );

    container.singleton(

        "PasswordService",

        () => passwordService

    );

    container.singleton(

        "EncryptionService",

        () => encryptionService

    );

    container.singleton(

        "HashingService",

        () => hashingService

    );

}
