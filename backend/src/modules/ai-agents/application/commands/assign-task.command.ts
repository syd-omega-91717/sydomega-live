// ============================================================================
// FILE: /backend/src/modules/ai-agents/application/commands/assign-task.command.ts
// NEW FILE
// ============================================================================

export class AssignTaskCommand{

    constructor(

        readonly agentId:string,

        readonly objective:string

    ){}

}
