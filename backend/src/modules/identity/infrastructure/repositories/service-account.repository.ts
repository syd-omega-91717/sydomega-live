// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/service-account.repository.ts
// NEW FILE
// ============================================================================

import { ServiceAccountAggregate }
from "../../domain/aggregates/service-account.aggregate";

export interface ServiceAccountRepository{

    create(

        account:ServiceAccountAggregate

    ):Promise<void>;

    update(

        account:ServiceAccountAggregate

    ):Promise<void>;

    findById(

        id:string

    ):Promise<ServiceAccountAggregate|null>;

    delete(

        id:string

    ):Promise<void>;

}
