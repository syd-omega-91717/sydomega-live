// ============================================================================
// FILE: /backend/src/modules/ai/application/services/orchestrator.service.ts
// NEW FILE
// ============================================================================

import { ModelResponse }
from "../../domain/entities/model-response";

export interface OrchestratorService{

    orchestrate(

        requestId:string

    ):Promise<ModelResponse>;

    consensus(

        orchestrationId:string

    ):Promise<ModelResponse>;

}
