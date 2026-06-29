// ============================================================================
// FILE: /backend/src/kernel/security/authorization-policy.ts
// NEW FILE
// ============================================================================

import { AuthorizationRequest }
from "./authorization-request.js";

import { AuthorizationResult }
from "./authorization-result.js";

export interface AuthorizationPolicy {

    evaluate(

        request: AuthorizationRequest

    ): Promise<AuthorizationResult>;

}
