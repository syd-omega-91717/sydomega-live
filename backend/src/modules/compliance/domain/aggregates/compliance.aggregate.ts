// ============================================================================
// FILE: /backend/src/modules/compliance/domain/aggregates/compliance.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ComplianceControlId }
from "../value-objects/compliance-control-id";

export class ComplianceAggregate
extends AggregateRoot<ComplianceControlId>{

    registerControl(){}

    collectEvidence(){}

    evaluate(){}

    remediate(){}

    certify(){}

}
