// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/delegation.ts
// NEW FILE
// ============================================================================

import { DelegationId }
from "../value-objects/delegation-id";

import { DelegationStatus }
from "../enums/delegation-status";

import { DelegatedPermission }
from "./delegated-permission";

export class Delegation{

    constructor(

        readonly id:DelegationId,

        readonly delegatorId:string,

        readonly delegateId:string,

        readonly permissions:DelegatedPermission[],

        readonly status:DelegationStatus,

        readonly validFrom:Date,

        readonly validUntil:Date

    ){}

}
