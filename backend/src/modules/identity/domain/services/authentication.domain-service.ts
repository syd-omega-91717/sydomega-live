// ============================================================================
// FILE: /backend/src/modules/identity/domain/services/authentication.domain-service.ts
// NEW FILE
// ============================================================================

import { Identity } from "../entities/identity.entity.js";

export class AuthenticationDomainService {

    public ensureAccountCanLogin(

        identity: Identity

    ): void {

        if (

            !identity.isEnabled()

        ) {

            throw new Error(

                "Account disabled."

            );

        }

        if (

            !identity.isApproved()

        ) {

            throw new Error(

                "Account not approved."

            );

        }

    }

    public registerSuccessfulLogin(

        identity: Identity

    ): void {

        identity.resetFailedLogins();

    }

    public registerFailedLogin(

        identity: Identity

    ): void {

        identity.registerFailedLogin();

        if (

            identity.failedLoginCount >= 5

        ) {

            identity.disable();

        }

    }

}

export default new AuthenticationDomainService();
