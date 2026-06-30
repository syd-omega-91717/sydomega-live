// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/rbac.repository.ts
// NEW FILE
// ============================================================================

import { RbacAggregate }
from "../../domain/aggregates/rbac.aggregate";

export interface RbacRepository{

    save(

        aggregate:RbacAggregate

    ):Promise<void>;

    findRole(

        roleId:string

    ):Promise<RbacAggregate|null>;

    assignments(

        userId:string

    ):Promise<string[]>;

}
