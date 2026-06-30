// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/analyze-behavior.command.ts
// NEW FILE
// ============================================================================

export class AnalyzeBehaviorCommand{

    constructor(

        readonly userId:string,

        readonly sessionId:string,

        readonly ipAddress:string,

        readonly deviceId:string,

        readonly latitude:number,

        readonly longitude:number

    ){}

}
