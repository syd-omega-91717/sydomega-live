// ============================================================================
// FILE: /backend/src/modules/governance/domain/entities/ai-asset.ts
// NEW FILE
// ============================================================================

export class AIAsset{

    constructor(

        readonly assetId:string,

        readonly name:string,

        readonly assetType:string,

        readonly owner:string,

        readonly risk:string,

        readonly approved:boolean

    ){}

}
