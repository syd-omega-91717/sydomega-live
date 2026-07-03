// ============================================================================
// FILE: /backend/src/modules/guardrails/application/commands/validate-request.command.ts
// NEW FILE
// ============================================================================

export class ValidateRequestCommand{

    constructor(

        readonly prompt:string,

        readonly tenantId:string

    ){}

}
