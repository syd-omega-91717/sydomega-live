// ============================================================================
// FILE: /backend/src/modules/tools/domain/aggregates/tool.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ToolId }
from "../value-objects/tool-id";

export class ToolAggregate
extends AggregateRoot<ToolId>{

    register(){}

    validatePermissions(){}

    execute(){}

    stream(){}

    terminate(){}

}
