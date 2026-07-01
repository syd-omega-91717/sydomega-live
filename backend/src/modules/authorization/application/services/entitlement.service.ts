// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/entitlement.service.ts
// NEW FILE
// ============================================================================

import { Entitlement }
from "../../domain/entities/entitlement";

export interface EntitlementService{

    active(

        principalId:string

    ):Promise<Entitlement[]>;

    effective(

        principalId:string

    ):Promise<Entitlement[]>;

}
