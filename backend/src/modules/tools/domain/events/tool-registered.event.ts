// ============================================================================
// FILE: /backend/src/modules/tools/domain/events/tool-registered.event.ts
// NEW FILE
// ============================================================================

export class ToolRegisteredEvent{

    constructor(

        readonly toolId:string,

        readonly name:string

    ){}

}
