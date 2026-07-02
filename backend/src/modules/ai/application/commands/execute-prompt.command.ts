// ============================================================================
// FILE: /backend/src/modules/ai/application/commands/execute-prompt.command.ts
// NEW FILE
// ============================================================================

export class ExecutePromptCommand{

    constructor(

        readonly promptId:string,

        readonly variables:Record<string,unknown>

    ){}

}
