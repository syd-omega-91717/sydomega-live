// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/request-completed.event.ts
// NEW FILE
// ============================================================================

export class RequestCompletedEvent{

    constructor(

        readonly requestId:string,

        readonly duration:number

    ){}

}
