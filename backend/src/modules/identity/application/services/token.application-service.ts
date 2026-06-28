// ============================================================================
// FILE: /backend/src/modules/identity/application/services/token.application-service.ts
// NEW FILE
// ============================================================================

import jwtService from "../../../../security/authentication/jwt.service.js";

import refreshTokenService from "../../../../security/authentication/refreshToken.service.js";

import { Identity } from "../../domain/entities/identity.entity.js";

export class TokenApplicationService {

    public issue(

        identity: Identity

    ) {

        const accessToken =

            jwtService.sign({

                sub: identity.id,

                email: identity.email,

                role: identity.role

            });

        const refresh =

            refreshTokenService.generate();

        return {

            accessToken,

            refreshToken:

                refresh.token,

            refreshExpiresAt:

                refresh.expiresAt

        };

    }

}

export default new TokenApplicationService();
