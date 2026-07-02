// ============================================================================
// FILE: /backend/src/modules/compliance/infrastructure/repositories/compliance-monitor.repository.ts
// NEW FILE
// ============================================================================

import { ComplianceMonitorAggregate }
from "../../domain/aggregates/compliance-monitor.aggregate";

export interface ComplianceMonitorRepository{

    save(

        aggregate:ComplianceMonitorAggregate

    ):Promise<void>;

    active(

    ):Promise<ComplianceMonitorAggregate[]>;

}
