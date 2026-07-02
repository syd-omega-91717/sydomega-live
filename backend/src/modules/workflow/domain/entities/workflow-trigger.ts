// ============================================================================
// FILE: /backend/src/modules/workflow/domain/entities/workflow-trigger.ts
// NEW FILE
// ============================================================================

import { TriggerType }
from "../enums/trigger-type";

export class WorkflowTrigger{

    constructor(

        readonly triggerId:string,

        readonly workflowId:string,

        readonly triggerType:TriggerType,

        readonly configuration:Record<string,unknown>,

        readonly enabled:boolean

    ){}

}
