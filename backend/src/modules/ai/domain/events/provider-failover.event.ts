// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/provider-failover.event.ts
// NEW FILE
// ============================================================================

export class ProviderFailoverEvent{

    constructor(

        readonly requestId:string,

        readonly previousProvider:string,

        readonly newProvider:string

    ){}

}
