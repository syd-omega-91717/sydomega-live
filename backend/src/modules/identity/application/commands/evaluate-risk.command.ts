// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/evaluate-risk.command.ts
// NEW FILE
// ============================================================================

export class EvaluateRiskCommand{

    constructor(

        readonly userId:string,

        readonly sessionId:string,

        readonly ipAddress:string,

        readonly deviceId:string,

        readonly userAgent:string

    ){}

}
