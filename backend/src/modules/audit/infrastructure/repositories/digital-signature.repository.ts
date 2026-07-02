// ============================================================================
// FILE: /backend/src/modules/audit/infrastructure/repositories/digital-signature.repository.ts
// NEW FILE
// ============================================================================

import { DigitalSignatureAggregate }
from "../../domain/aggregates/digital-signature.aggregate";

export interface DigitalSignatureRepository{

    save(

        aggregate:DigitalSignatureAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<DigitalSignatureAggregate|null>;

}
