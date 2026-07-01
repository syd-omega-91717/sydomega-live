// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/jit-access.service.ts
// NEW FILE
// ============================================================================

import { JitAccess }
from "../../domain/entities/jit-access";

export interface JitAccessService{

    active(

        principalId:string

    ):Promise<JitAccess[]>;

    expire():Promise<void>;

}
