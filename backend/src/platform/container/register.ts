// ============================================================================
// FILE: /backend/src/platform/container/register.ts
// REPLACE THE ENTIRE FILE
// ============================================================================

import container from "./container.js";

import TOKENS from "./tokens.js";

import logger from "../observability/logger.js";
import metrics from "../observability/metrics.js";
import tracing from "../observability/tracing.js";
import health from "../observability/health.js";

import jwtService from "../../security/authentication/jwt.service.js";
import passwordService from "../../security/cryptography/password.service.js";
import refreshTokenService from "../../security/authentication/refreshToken.service.js";
import sessionService from "../../security/authentication/session.service.js";
import encryptionService from "../../security/cryptography/encryption.service.js";
import hashingService from "../../security/cryptography/hashing.service.js";

export function registerContainer(): void {

    container.singleton(

        TOKENS.Logger,

        () => logger

    );

    container.singleton(

        TOKENS.Metrics,

        () => metrics

    );

    container.singleton(

        TOKENS.Tracing,

        () => tracing

    );

    container.singleton(

        TOKENS.Health,

        () => health

    );

    container.singleton(

        TOKENS.JwtService,

        () => jwtService

    );

    container.singleton(

        TOKENS.PasswordService,

        () => passwordService

    );

    container.singleton(

        TOKENS.RefreshTokenService,

        () => refreshTokenService

    );

    container.singleton(

        TOKENS.SessionService,

        () => sessionService

    );

    container.singleton(

        TOKENS.EncryptionService,

        () => encryptionService

    );

    container.singleton(

        TOKENS.HashingService,

        () => hashingService

    );

}
