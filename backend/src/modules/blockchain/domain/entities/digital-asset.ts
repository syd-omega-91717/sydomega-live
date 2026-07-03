// ============================================================================
// FILE: /backend/src/modules/blockchain/domain/entities/digital-asset.ts
// NEW FILE
// ============================================================================

export class DigitalAsset{

    constructor(

        readonly assetId:string,

        readonly owner:string,

        readonly tokenStandard:string,

        readonly metadataUri:string,

        readonly immutable:boolean

    ){}

}
