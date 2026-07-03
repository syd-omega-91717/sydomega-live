// ============================================================================
// FILE: /backend/src/modules/tools/application/services/tool-runtime.service.ts
// NEW FILE
// ============================================================================

import { ToolExecution }
from "../../domain/entities/tool-execution";

export interface ToolRuntimeService{

    execute(

        toolId:string,

        payload:unknown

    ):Promise<ToolExecution>;

    discover(

    ):Promise<Tool[]>;

}
