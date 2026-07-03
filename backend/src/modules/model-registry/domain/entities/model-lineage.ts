// ============================================================================
// FILE: /backend/src/modules/model-registry/domain/entities/model-lineage.ts
// NEW FILE
// ============================================================================

export class ModelLineage{

    constructor(

        readonly lineageId:string,

        readonly parentModel:string|null,

        readonly childModel:string,

        readonly datasetVersion:string,

        readonly trainingRun:string

    ){}

}
