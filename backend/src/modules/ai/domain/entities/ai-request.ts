// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/ai-request.ts
// NEW FILE
// ============================================================================

import { AIRequestId }
from "../value-objects/ai-request-id";

import { LLMProvider }
from "../enums/llm-provider";

import { AIRequestStatus }
from "../enums/request-status";

export class AIRequest{

    constructor(

        readonly id:AIRequestId,

        readonly tenantId:string,

        readonly model:string,

        readonly provider:LLMProvider,

        readonly promptTokens:number,

        readonly completionTokens:number,

        readonly status:AIRequestStatus,

        readonly createdAt:Date

    ){}

}
