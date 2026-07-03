// ============================================================================
// FILE: /backend/src/modules/memory/domain/events/memory-stored.event.ts
// NEW FILE
// ============================================================================

export class MemoryStoredEvent{

    constructor(

        readonly memoryId:string,

        readonly type:string

    ){}

}
