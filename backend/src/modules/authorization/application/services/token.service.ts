// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/token.service.ts
// NEW FILE
// ============================================================================

import { AccessToken }
from "../../domain/entities/access-token";

export interface TokenService{

    issue(

        principalId:string,

        scopes:string[]

    ):Promise<AccessToken>;

    introspect(

        token:string

    ):Promise<boolean>;

}
