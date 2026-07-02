// ============================================================================
// FILE: /backend/src/modules/ai/domain/aggregates/embedding-pipeline.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { EmbeddingJobId }
from "../value-objects/embedding-job-id";

export class EmbeddingPipelineAggregate
extends AggregateRoot<EmbeddingJobId>{

    ingest(){}

    extractText(){}

    chunk(){}

    embed(){}

    index(){}

    finalize(){}

}
