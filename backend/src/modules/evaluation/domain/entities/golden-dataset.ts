// ============================================================================
// FILE: /backend/src/modules/evaluation/domain/entities/golden-dataset.ts
// NEW FILE
// ============================================================================

export class GoldenDataset{

    constructor(

        readonly datasetId:string,

        readonly name:string,

        readonly version:string,

        readonly samples:number,

        readonly updatedAt:Date

    ){}

}
