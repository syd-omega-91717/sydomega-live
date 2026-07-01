// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/entitlement.ts
// NEW FILE
// ============================================================================

import { EntitlementId }
from "../value-objects/entitlement-id";

import { EntitlementStatus }
from "../enums/entitlement-status";

export class Entitlement{

    constructor(

        readonly id:EntitlementId,

        readonly principalId:string,

        readonly resource:string,

        readonly action:string,

        readonly status:EntitlementStatus,

        readonly grantedAt:Date,

        readonly expiresAt:Date|null

    ){}

}
