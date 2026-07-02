// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/oidc.service.ts
// NEW FILE
// ============================================================================

import { IdToken }
from "../../domain/entities/id-token";

export interface OidcService{

    issueIdToken(

        principalId:string,

        clientId:string

    ):Promise<IdToken>;

    userInfo(

        accessToken:string

    ):Promise<any>;

}
