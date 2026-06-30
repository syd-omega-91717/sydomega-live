// ============================================================================
// FILE: /backend/src/modules/audit/domain/entities/audit-log.ts
// NEW FILE
// ============================================================================

import { AuditLogId }
from "../value-objects/audit-log-id";

import { AuditSeverity }
from "../enums/audit-severity";

import { AuditOutcome }
from "../enums/audit-outcome";

export class AuditLog{

    constructor(

        readonly id:AuditLogId,

        readonly tenantId:string,

        readonly actorId:string,

        readonly action:string,

        readonly resource:string,

        readonly outcome:AuditOutcome,

        readonly severity:AuditSeverity,

        readonly ipAddress:string,

        readonly userAgent:string,

        readonly metadata:Record<string,unknown>,

        readonly occurredAt:Date

    ){}

}
