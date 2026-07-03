// ============================================================================
// FILE: /backend/src/modules/tools/infrastructure/repositories/tool.repository.ts
// NEW FILE
// ============================================================================

import { ToolAggregate }
from "../../domain/aggregates/tool.aggregate";

export interface ToolRepository{

    save(

        aggregate:ToolAggregate

    ):Promise<void>;

    find(

        toolId:string

    ):Promise<ToolAggregate|null>;

}
