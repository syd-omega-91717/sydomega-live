// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/conditional-access-evaluation.ts
// NEW FILE
// ============================================================================

import { ConditionalAccessResult }
from "../enums/conditional-access-result";

export class ConditionalAccessEvaluation{

    constructor(

        readonly principalId:string,

        readonly applicationId:string,

        readonly result:ConditionalAccessResult,

        readonly evaluatedAt:Date

    ){}

}
