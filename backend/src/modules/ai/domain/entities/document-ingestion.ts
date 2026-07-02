// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/document-ingestion.ts
// NEW FILE
// ============================================================================

import { EmbeddingJobId }
from "../value-objects/embedding-job-id";

import { DocumentSource }
from "../enums/document-source";

export class DocumentIngestion{

    constructor(

        readonly id:EmbeddingJobId,

        readonly tenantId:string,

        readonly source:DocumentSource,

        readonly filename:string,

        readonly checksum:string,

        readonly size:number,

        readonly receivedAt:Date

    ){}

}
