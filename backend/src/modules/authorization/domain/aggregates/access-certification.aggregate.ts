// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/access-certification.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AccessCertificationId }
from "../value-objects/access-certification-id";

export class AccessCertificationAggregate
extends AggregateRoot<AccessCertificationId>{

    launch(){}

    certify(){}

    revoke(){}

    finalize(){}

}
