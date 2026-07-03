// ============================================================================
// FILE: /backend/src/modules/governance/domain/entities/decision-trace.ts
// NEW FILE
// ============================================================================

export class DecisionTrace{

    constructor(

        readonly traceId:string,

        readonly requestId:string,

        readonly model:string,

        readonly policyVersion:string,

        readonly explanation:string,

        readonly timestamp:Date

    ){}

}
