// ============================================================================
// FILE: /backend/src/modules/ai/application/services/embedding-pipeline.service.ts
// NEW FILE
// ============================================================================

export interface EmbeddingPipelineService{

    ingest(

        documentId:string

    ):Promise<void>;

    embed(

        documentId:string

    ):Promise<void>;

}
