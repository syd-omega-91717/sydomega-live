// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/jit-access.ts
// NEW FILE
// ============================================================================

import { JitAccessId }
from "../value-objects/jit-access-id";

import { JitAccessStatus }
from "../enums/jit-access-status";

import { JitAccessType }
from "../enums/jit-access-type";

export class JitAccess{

    constructor(

        readonly id:JitAccessId,

        readonly principalId:string,

        readonly targetId:string,

        readonly type:JitAccessType,

        readonly status:JitAccessStatus,

        readonly justification:string,

        readonly startsAt:Date,

        readonly expiresAt:Date

    ){}

}
