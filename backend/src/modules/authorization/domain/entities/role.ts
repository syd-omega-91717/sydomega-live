// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/role.ts
// NEW FILE
// ============================================================================

import { RoleId }
from "../value-objects/role-id";

import { Permission }
from "./permission";

export class Role{

    constructor(

        readonly id:RoleId,

        readonly name:string,

        readonly description:string,

        readonly permissions:Permission[]

    ){}

}
