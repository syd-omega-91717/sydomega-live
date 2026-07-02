// ============================================================================
// FILE: /backend/src/modules/compliance/application/commands/calculate-risk.command.ts
// NEW FILE
// ============================================================================

export class CalculateRiskCommand{

    constructor(

        readonly assetId:string,

        readonly controlId:string

    ){}

}
