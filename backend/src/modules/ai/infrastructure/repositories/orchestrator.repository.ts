// ============================================================================
// FILE: /backend/src/modules/ai/infrastructure/repositories/orchestrator.repository.ts
// NEW FILE
// ============================================================================

import { OrchestratorAggregate }
from "../../domain/aggregates/orchestrator.aggregate";

export interface OrchestratorRepository{

    save(

        aggregate:OrchestratorAggregate

    ):Promise<void>;

    active(

    ):Promise<OrchestratorAggregate[]>;

}
