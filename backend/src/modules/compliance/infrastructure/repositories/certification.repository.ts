// ============================================================================
// FILE: /backend/src/modules/compliance/infrastructure/repositories/certification.repository.ts
// NEW FILE
// ============================================================================

import { CertificationAggregate }
from "../../domain/aggregates/certification.aggregate";

export interface CertificationRepository{

    save(

        aggregate:CertificationAggregate

    ):Promise<void>;

    find(

        certificationId:string

    ):Promise<CertificationAggregate|null>;

}
