// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/permission.ts
// NEW FILE
// ============================================================================

import { PermissionId }
from "../value-objects/permission-id";

export class Permission{

    constructor(

        readonly id:PermissionId,

        readonly resource:string,

        readonly action:string,

        readonly description:string

    ){}

}
