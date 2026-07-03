// ============================================================================
// FILE: /backend/src/modules/evaluation/domain/events/evaluation-started.event.ts
// NEW FILE
// ============================================================================

export class EvaluationStartedEvent{

    constructor(

        readonly evaluationId:string,

        readonly model:string

    ){}

}
