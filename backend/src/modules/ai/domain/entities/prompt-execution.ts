// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/prompt-execution.ts
// NEW FILE
// ============================================================================

export class PromptExecution{

    constructor(

        readonly executionId:string,

        readonly promptId:string,

        readonly model:string,

        readonly duration:number,

        readonly success:boolean,

        readonly executedAt:Date

    ){}

}
