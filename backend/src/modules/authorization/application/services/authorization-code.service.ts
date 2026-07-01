// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/authorization-code.service.ts
// NEW FILE
// ============================================================================

import { AuthorizationCode }
from "../../domain/entities/authorization-code";

export interface AuthorizationCodeService{

    issue(

        clientId:string,

        principalId:string

    ):Promise<AuthorizationCode>;

    redeem(

        code:string,

        verifier:string

    ):Promise<void>;

}
