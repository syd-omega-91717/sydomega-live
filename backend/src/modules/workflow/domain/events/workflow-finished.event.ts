// ============================================================================
// FILE: /backend/src/modules/workflow/domain/events/workflow-finished.event.ts
// NEW FILE
// ============================================================================

export class WorkflowFinishedEvent{

    constructor(

        readonly executionId:string,

        readonly duration:number,

        readonly success:boolean

    ){}

}
