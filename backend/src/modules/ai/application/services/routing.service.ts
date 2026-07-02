// ============================================================================
// FILE: /backend/src/modules/ai/application/services/routing.service.ts
// NEW FILE
// ============================================================================

import { RoutingDecision }
from "../../domain/entities/routing-decision";

export interface RoutingService{

    select(

        requestId:string

    ):Promise<RoutingDecision>;

    failover(

        requestId:string

    ):Promise<RoutingDecision>;

}
