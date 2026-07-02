// ============================================================================
// FILE: /backend/src/modules/audit/application/services/audit.service.ts
// NEW FILE
// ============================================================================

import { AuditRecord }
from "../../domain/entities/audit-record";

export interface AuditService{

    record(

        record:AuditRecord

    ):Promise<void>;

}
