// ============================================================================
// FILE: /backend/src/modules/tools/domain/events/tool-executed.event.ts
// NEW FILE
// ============================================================================

export class ToolExecutedEvent{

    constructor(

        readonly executionId:string,

        readonly toolId:string,

        readonly success:boolean

    ){}

}
