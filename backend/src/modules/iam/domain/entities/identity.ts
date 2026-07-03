// ============================================================================
// FILE: /backend/src/modules/iam/domain/entities/identity.ts
// NEW FILE
// ============================================================================

import { IdentityId }
from "../value-objects/identity-id";

import { IdentityStatus }
from "../enums/identity-status";

export class Identity{

    constructor(

        readonly id:IdentityId,

        readonly tenantId:string,

        readonly username:string,

        readonly email:string,

        readonly status:IdentityStatus,

        readonly createdAt:Date

    ){}

}
