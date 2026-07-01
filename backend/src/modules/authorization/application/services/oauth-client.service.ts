// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/oauth-client.service.ts
// NEW FILE
// ============================================================================

import { OAuthClient }
from "../../domain/entities/oauth-client";

export interface OAuthClientService{

    register(

        client:OAuthClient

    ):Promise<void>;

    validate(

        clientId:string

    ):Promise<boolean>;

}
