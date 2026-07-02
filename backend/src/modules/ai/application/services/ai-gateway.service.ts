// ============================================================================
// FILE: /backend/src/modules/ai/application/services/ai-gateway.service.ts
// NEW FILE
// ============================================================================

import { AIRequest }
from "../../domain/entities/ai-request";

export interface AIGatewayService{

    execute(

        request:AIRequest

    ):Promise<void>;

    health():Promise<void>;

}
