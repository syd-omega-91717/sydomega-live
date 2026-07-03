// ============================================================================
// FILE: /backend/src/modules/evaluation/domain/events/evaluation-completed.event.ts
// NEW FILE
// ============================================================================

export class EvaluationCompletedEvent{

    constructor(

        readonly evaluationId:string,

        readonly overallScore:number

    ){}

}
