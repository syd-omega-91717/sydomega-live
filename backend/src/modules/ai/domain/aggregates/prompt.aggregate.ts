// ============================================================================
// FILE: /backend/src/modules/ai/domain/aggregates/prompt.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { PromptId }
from "../value-objects/prompt-id";

export class PromptAggregate
extends AggregateRoot<PromptId>{

    validate(){}

    compile(){}

    publish(){}

    version(){}

    archive(){}

}
