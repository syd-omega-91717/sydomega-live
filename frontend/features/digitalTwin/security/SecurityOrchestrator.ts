// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/SecurityOrchestrator.ts
// ============================================================================

import {

AccessControlEngine

}

from "./AccessControlEngine";

import {

ZeroTrustEngine

}

from "./ZeroTrustEngine";

export class SecurityOrchestrator{

    private acl=

    new AccessControlEngine();

    private zeroTrust=

    new ZeroTrustEngine();

    authorize(

        permissions:string[],

        permission:string

    ){

        return this.zeroTrust.verify(

            true,

            this.acl.authorize(

                permissions,

                permission

            )

        );

    }

}
