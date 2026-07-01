// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/service-account.repository.ts
// NEW FILE
// ============================================================================

import { ServiceAccountAggregate }
from "../../domain/aggregates/service-account.aggregate";

export interface ServiceAccountRepository{

    save(

        aggregate:ServiceAccountAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<ServiceAccountAggregate|null>;

    list(

    ):Promise<ServiceAccountAggregate[]>;

}
