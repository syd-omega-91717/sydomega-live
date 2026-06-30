// ============================================================================
// FILE: /backend/src/modules/audit/domain/aggregates/audit.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AuditLogId }
from "../value-objects/audit-log-id";

export class AuditAggregate
extends AggregateRoot<AuditLogId>{

    append(){}

    archive(){}

    export(){}

}
