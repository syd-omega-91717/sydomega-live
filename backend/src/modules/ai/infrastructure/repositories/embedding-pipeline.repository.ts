// ============================================================================
// FILE: /backend/src/modules/ai/infrastructure/repositories/embedding-pipeline.repository.ts
// NEW FILE
// ============================================================================

import { EmbeddingPipelineAggregate }
from "../../domain/aggregates/embedding-pipeline.aggregate";

export interface EmbeddingPipelineRepository{

    save(

        aggregate:EmbeddingPipelineAggregate

    ):Promise<void>;

    active(

    ):Promise<EmbeddingPipelineAggregate[]>;

}
