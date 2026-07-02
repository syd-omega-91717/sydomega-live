// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/request-routed.event.ts
// NEW FILE
// ============================================================================

export class RequestRoutedEvent{

    constructor(

        readonly requestId:string,

        readonly provider:string,

        readonly model:string

    ){}

}
