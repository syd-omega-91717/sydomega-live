// ============================================================================
// FILE: /backend/src/modules/authorization/application/queries/evaluate-access.query.ts
// NEW FILE
// ============================================================================

export class EvaluateAccessQuery{

    constructor(

        readonly subjectId:string,

        readonly resource:string,

        readonly action:string,

        readonly context:Record<string,unknown>

    ){}

}
