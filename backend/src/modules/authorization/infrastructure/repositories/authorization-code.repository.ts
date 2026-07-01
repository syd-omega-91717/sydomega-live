// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/authorization-code.repository.ts
// NEW FILE
// ============================================================================

import { AuthorizationCodeAggregate }
from "../../domain/aggregates/authorization-code.aggregate";

export interface AuthorizationCodeRepository{

    save(

        aggregate:AuthorizationCodeAggregate

    ):Promise<void>;

    find(

        code:string

    ):Promise<AuthorizationCodeAggregate|null>;

}
