// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-request-record.ts
// NEW FILE
// ============================================================================

import { AccessRequestId }
from "../value-objects/access-request-id";

import { AccessRequestStatus }
from "../enums/access-request-status";

import { RequestedRole }
from "./requested-role";

export class AccessRequestRecord{

    constructor(

        readonly id:AccessRequestId,

        readonly requesterId:string,

        readonly approverId:string|null,

        readonly status:AccessRequestStatus,

        readonly requestedRoles:RequestedRole[],

        readonly createdAt:Date

    ){}

}
