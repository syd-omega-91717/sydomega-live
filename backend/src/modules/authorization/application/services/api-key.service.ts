// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/api-key.service.ts
// NEW FILE
// ============================================================================

import { ApiKey }
from "../../domain/entities/api-key";

export interface ApiKeyService{

    issue(

        ownerId:string,

        scopes:string[]

    ):Promise<ApiKey>;

    revoke(

        apiKeyId:string

    ):Promise<void>;

}
