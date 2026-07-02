// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/provider-selected.event.ts
// NEW FILE
// ============================================================================

export class ProviderSelectedEvent{

    constructor(

        readonly requestId:string,

        readonly provider:string

    ){}

}
