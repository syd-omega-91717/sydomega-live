// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/rbac.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { RoleId }
from "../value-objects/role-id";

export class RbacAggregate
extends AggregateRoot<RoleId>{

    createRole(){}

    addPermission(){}

    removePermission(){}

    assignRole(){}

    revokeRole(){}

}
