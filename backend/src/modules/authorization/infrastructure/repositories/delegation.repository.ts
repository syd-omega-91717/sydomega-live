// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/delegation.repository.ts
// NEW FILE
// ============================================================================

import { DelegationAggregate }
from "../../domain/aggregates/delegation.aggregate";

export interface DelegationRepository{

    save(

        aggregate:DelegationAggregate

    ):Promise<void>;

    find(

        delegationId:string

    ):Promise<DelegationAggregate|null>;

    active(

        delegateId:string

    ):Promise<DelegationAggregate[]>;

}
