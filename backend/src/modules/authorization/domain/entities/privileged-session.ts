// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/privileged-session.ts
// NEW FILE
// ============================================================================

import { PrivilegedSessionId }
from "../value-objects/privileged-session-id";

import { PrivilegedSessionStatus }
from "../enums/privileged-session-status";

import { PrivilegedCommand }
from "./privileged-command";

export class PrivilegedSession{

    constructor(

        readonly id:PrivilegedSessionId,

        readonly principalId:string,

        readonly approverId:string,

        readonly status:PrivilegedSessionStatus,

        readonly startedAt:Date|null,

        readonly endedAt:Date|null,

        readonly commands:PrivilegedCommand[]

    ){}

}
