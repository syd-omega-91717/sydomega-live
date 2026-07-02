// ============================================================================
// FILE: /backend/src/modules/compliance/domain/aggregates/remediation.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { RemediationId }
from "../value-objects/remediation-id";

export class RemediationAggregate
extends AggregateRoot<RemediationId>{

    approve(){}

    execute(){}

    rollback(){}

    verify(){}

    complete(){}

}
