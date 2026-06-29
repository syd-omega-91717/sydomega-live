// ============================================================================
// FILE: /backend/src/modules/oidc/application/services/id-token.service.ts
// NEW FILE
// ============================================================================

import { IdToken }
from "../../domain/entities/id-token";

export interface IdTokenService {

    issue(

        subject: string,

        clientId: string,

        nonce?: string

    ): Promise<IdToken>;

}
