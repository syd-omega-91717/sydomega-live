// ============================================================================
// FILE: /backend/src/modules/compliance/domain/aggregates/compliance-monitor.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ComplianceMonitorId }
from "../value-objects/compliance-monitor-id";

export class ComplianceMonitorAggregate
extends AggregateRoot<ComplianceMonitorId>{

    monitor(){}

    detectDrift(){}

    refreshEvidence(){}

    generateAlert(){}

    remediate(){}

}
