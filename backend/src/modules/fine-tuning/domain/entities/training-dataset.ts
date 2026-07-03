// ============================================================================
// FILE: /backend/src/modules/fine-tuning/domain/entities/training-dataset.ts
// NEW FILE
// ============================================================================

export class TrainingDataset{

    constructor(

        readonly datasetId:string,

        readonly name:string,

        readonly version:string,

        readonly records:number,

        readonly checksum:string,

        readonly validated:boolean

    ){}

}
