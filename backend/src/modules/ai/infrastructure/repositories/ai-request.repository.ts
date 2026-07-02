// ============================================================================
// FILE: /backend/src/modules/ai/infrastructure/repositories/ai-request.repository.ts
// NEW FILE
// ============================================================================

import { AIGatewayAggregate }
from "../../domain/aggregates/ai-gateway.aggregate";

export interface AIRequestRepository{

    save(

        aggregate:AIGatewayAggregate

    ):Promise<void>;

    active(

    ):Promise<AIGatewayAggregate[]>;

}
