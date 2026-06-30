// ============================================================================
// FILE: /backend/src/modules/audit/infrastructure/repositories/audit.repository.ts
// NEW FILE
// ============================================================================

import { AuditAggregate }
from "../../domain/aggregates/audit.aggregate";

export interface AuditRepository{

    save(

        aggregate:AuditAggregate

    ):Promise<void>;

    search(

        query:unknown

    ):Promise<AuditAggregate[]>;

}
