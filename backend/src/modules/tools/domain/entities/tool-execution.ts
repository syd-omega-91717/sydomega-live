// ============================================================================
// FILE: /backend/src/modules/tools/domain/entities/tool-execution.ts
// NEW FILE
// ============================================================================

import { ToolExecutionState }
from "../enums/tool-execution-state";

export class ToolExecution{

    constructor(

        readonly executionId:string,

        readonly toolId:string,

        readonly state:ToolExecutionState,

        readonly startedAt:Date,

        readonly completedAt:Date|null,

        readonly duration:number

    ){}

}
