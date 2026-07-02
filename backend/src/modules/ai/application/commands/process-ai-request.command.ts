// ============================================================================
// FILE: /backend/src/modules/ai/application/commands/process-ai-request.command.ts
// NEW FILE
// ============================================================================

export class ProcessAIRequestCommand{

    constructor(

        readonly prompt:string,

        readonly tenantId:string

    ){}

}
