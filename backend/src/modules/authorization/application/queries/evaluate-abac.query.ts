// ============================================================================
// FILE: /backend/src/modules/authorization/application/queries/evaluate-abac.query.ts
// NEW FILE
// ============================================================================

export class EvaluateAbacQuery{

    constructor(

        readonly subjectId:string,

        readonly resource:string,

        readonly action:string,

        readonly attributes:Record<string,unknown>

    ){}

}
