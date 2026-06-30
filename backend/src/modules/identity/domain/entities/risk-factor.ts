// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/risk-factor.ts
// NEW FILE
// ============================================================================

export class RiskFactor{

    constructor(

        readonly name:string,

        readonly weight:number,

        readonly score:number

    ){}

}
