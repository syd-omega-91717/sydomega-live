// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/access-request.repository.ts
// NEW FILE
// ============================================================================

import { AccessRequestAggregate }
from "../../domain/aggregates/access-request.aggregate";

export interface AccessRequestRepository{

    save(

        aggregate:AccessRequestAggregate

    ):Promise<void>;

    find(

        requestId:string

    ):Promise<AccessRequestAggregate|null>;

    pending(

    ):Promise<AccessRequestAggregate[]>;

}
