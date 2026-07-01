// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/access-certification.repository.ts
// NEW FILE
// ============================================================================

import { AccessCertificationAggregate }
from "../../domain/aggregates/access-certification.aggregate";

export interface AccessCertificationRepository{

    save(

        aggregate:AccessCertificationAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<AccessCertificationAggregate|null>;

    active(

    ):Promise<AccessCertificationAggregate[]>;

}
