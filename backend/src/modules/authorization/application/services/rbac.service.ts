// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/rbac.service.ts
// NEW FILE
// ============================================================================

import { Role }
from "../../domain/entities/role";

export interface RbacService{

    roles(

        userId:string

    ):Promise<Role[]>;

    permissions(

        userId:string

    ):Promise<string[]>;

}
