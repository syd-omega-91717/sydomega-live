// ============================================================================
// FILE: /backend/src/modules/api-gateway/infrastructure/repositories/api-gateway.repository.ts
// NEW FILE
// ============================================================================

import { ApiGatewayAggregate }
from "../../domain/aggregates/api-gateway.aggregate";

export interface ApiGatewayRepository{

    save(
        aggregate:ApiGatewayAggregate
    ):Promise<void>;

}
