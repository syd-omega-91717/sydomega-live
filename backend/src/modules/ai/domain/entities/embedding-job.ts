// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/embedding-job.ts
// NEW FILE
// ============================================================================

export class EmbeddingJob{

    constructor(

        readonly jobId:string,

        readonly documentId:string,

        readonly embeddingModel:string,

        readonly vectorsGenerated:number,

        readonly completed:boolean,

        readonly completedAt:Date|null

    ){}

}
