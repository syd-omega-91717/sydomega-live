// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/conditional-access.service.ts
// NEW FILE
// ============================================================================

import { ConditionalAccessEvaluation }
from "../../domain/entities/conditional-access-evaluation";

export interface ConditionalAccessService{

    evaluate(

        principalId:string,

        applicationId:string

    ):Promise<ConditionalAccessEvaluation>;

}
