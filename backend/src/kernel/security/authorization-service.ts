// ============================================================================
// FILE: /backend/src/kernel/security/authorization-service.ts
// NEW FILE
// ============================================================================

import { AuthorizationRequest }
from "./authorization-request.js";

import { AuthorizationResult }
from "./authorization-result.js";

export interface AuthorizationService {

    authorize(

        request: AuthorizationRequest

    ): Promise<AuthorizationResult>;

}
