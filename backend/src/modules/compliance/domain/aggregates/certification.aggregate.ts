// ============================================================================
// FILE: /backend/src/modules/compliance/domain/aggregates/certification.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { CertificationId }
from "../value-objects/certification-id";

export class CertificationAggregate
extends AggregateRoot<CertificationId>{

    prepare(){}

    submit(){}

    approve(){}

    issue(){}

    revoke(){}

    renew(){}

}
