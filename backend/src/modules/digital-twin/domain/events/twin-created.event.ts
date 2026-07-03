// ============================================================================
// FILE: /backend/src/modules/digital-twin/domain/events/twin-created.event.ts
// NEW FILE
// ============================================================================

export class TwinCreatedEvent{

    constructor(

        readonly twinId:string,

        readonly tenantId:string

    ){}

}
