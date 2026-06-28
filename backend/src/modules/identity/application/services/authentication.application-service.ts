// ============================================================================
// FILE: /backend/src/modules/identity/application/services/authentication.application-service.ts
// NEW FILE
// ============================================================================

import type {

    IdentityRepository

} from "../../domain/repositories/identity.repository.interface.js";

import authenticationDomainService from "../../domain/services/authentication.domain-service.js";

import passwordService from "../../../../security/cryptography/password.service.js";

import jwtService from "../../../../security/authentication/jwt.service.js";

import refreshTokenService from "../../../../security/authentication/refreshToken.service.js";

export class AuthenticationApplicationService {

    constructor(

        private readonly repository: IdentityRepository

    ) {}

    public async login(

        email: string,

        password: string

    ) {

        const result =

            await this.repository.findByEmail(

                email

            );

        if (

            result.isFailure

        ) {

            throw new Error(

                "Invalid credentials."

            );

        }

        const identity = result.value;

        authenticationDomainService.ensureAccountCanLogin(

            identity

        );

        const valid =

            await passwordService.verify(

                password,

                identity.passwordHash

            );

        if (!valid) {

            authenticationDomainService.registerFailedLogin(

                identity

            );

            await this.repository.update(

                identity

            );

            throw new Error(

                "Invalid credentials."

            );

        }

        authenticationDomainService.registerSuccessfulLogin(

            identity

        );

        await this.repository.update(

            identity

        );

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

            refreshToken: refresh.token,

            expiresAt: refresh.expiresAt

        };

    }

}
