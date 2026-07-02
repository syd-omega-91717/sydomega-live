// ============================================================================
// FILE: /backend/src/modules/ai-agents/domain/entities/agent-result.ts
// NEW FILE
// ============================================================================

export class AgentResult{

    constructor(

        readonly taskId:string,

        readonly success:boolean,

        readonly output:string,

        readonly duration:number

    ){}

}
