// ============================================================================
// FILE: /backend/src/modules/ai/application/services/prompt.service.ts
// NEW FILE
// ============================================================================

import { PromptTemplate }
from "../../domain/entities/prompt-template";

export interface PromptService{

    publish(

        promptId:string

    ):Promise<void>;

    execute(

        promptId:string,

        variables:Record<string,unknown>

    ):Promise<PromptTemplate>;

}
