// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/risk-factor.ts
// NEW FILE
// ============================================================================

export class RiskFactor{

    constructor(

        readonly factorId:string,

        readonly category:string,

        readonly weight:number,

        readonly value:number

    ){}

}
