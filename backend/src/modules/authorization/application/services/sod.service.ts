// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/sod.service.ts
// NEW FILE
// ============================================================================

import { SodViolation }
from "../../domain/entities/sod-violation";

export interface SodService{

    evaluate(

        userId:string

    ):Promise<SodViolation[]>;

    validateAssignment(

        userId:string,

        roleId:string

    ):Promise<boolean>;

}
