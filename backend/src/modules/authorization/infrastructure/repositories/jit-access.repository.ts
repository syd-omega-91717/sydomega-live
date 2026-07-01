// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/jit-access.repository.ts
// NEW FILE
// ============================================================================

import { JitAccessAggregate }
from "../../domain/aggregates/jit-access.aggregate";

export interface JitAccessRepository{

    save(

        aggregate:JitAccessAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<JitAccessAggregate|null>;

    active(

        principalId:string

    ):Promise<JitAccessAggregate[]>;

}
