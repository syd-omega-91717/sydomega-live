// ============================================================================
// FILE: /backend/src/modules/audit/domain/entities/audit-record.ts
// NEW FILE
// ============================================================================

import { AuditRecordId }
from "../value-objects/audit-record-id";

import { AuditSeverity }
from "../enums/audit-severity";

import { AuditCategory }
from "../enums/audit-category";

export class AuditRecord{

    constructor(

        readonly id:AuditRecordId,

        readonly eventId:string,

        readonly principalId:string|null,

        readonly category:AuditCategory,

        readonly severity:AuditSeverity,

        readonly action:string,

        readonly resource:string,

        readonly ipAddress:string,

        readonly occurredAt:Date

    ){}

}
