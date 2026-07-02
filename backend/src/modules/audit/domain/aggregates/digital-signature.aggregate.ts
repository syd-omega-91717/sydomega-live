// ============================================================================
// FILE: /backend/src/modules/audit/domain/aggregates/digital-signature.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { DigitalSignatureId }
from "../value-objects/digital-signature-id";

export class DigitalSignatureAggregate
extends AggregateRoot<DigitalSignatureId>{

    sign(){}

    verify(){}

    revoke(){}

    rotateCertificate(){}

}
