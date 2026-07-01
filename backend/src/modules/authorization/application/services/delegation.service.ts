// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/delegation.service.ts
// NEW FILE
// ============================================================================

import { Delegation }
from "../../domain/entities/delegation";

export interface DelegationService{

    active(

        delegateId:string

    ):Promise<Delegation[]>;

    validate(

        delegationId:string

    ):Promise<boolean>;

}
