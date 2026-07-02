// ============================================================================
// FILE: /backend/src/modules/ai/infrastructure/repositories/prompt.repository.ts
// NEW FILE
// ============================================================================

import { PromptAggregate }
from "../../domain/aggregates/prompt.aggregate";

export interface PromptRepository{

    save(

        aggregate:PromptAggregate

    ):Promise<void>;

    find(

        promptId:string

    ):Promise<PromptAggregate|null>;

}
