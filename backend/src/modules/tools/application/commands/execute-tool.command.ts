// ============================================================================
// FILE: /backend/src/modules/tools/application/commands/execute-tool.command.ts
// NEW FILE
// ============================================================================

export class ExecuteToolCommand{

    constructor(

        readonly toolId:string,

        readonly payload:unknown

    ){}

}
