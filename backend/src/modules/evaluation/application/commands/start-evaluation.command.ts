// ============================================================================
// FILE: /backend/src/modules/evaluation/application/commands/start-evaluation.command.ts
// NEW FILE
// ============================================================================

export class StartEvaluationCommand{

    constructor(

        readonly model:string,

        readonly dataset:string

    ){}

}
