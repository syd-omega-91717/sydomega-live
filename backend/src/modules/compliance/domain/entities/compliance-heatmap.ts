// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/compliance-heatmap.ts
// NEW FILE
// ============================================================================

export class ComplianceHeatmap{

    constructor(

        readonly framework:string,

        readonly domain:string,

        readonly score:number,

        readonly color:string

    ){}

}
