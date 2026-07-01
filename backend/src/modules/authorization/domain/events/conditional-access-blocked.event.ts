// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/conditional-access-blocked.event.ts
// NEW FILE
// ============================================================================

export class ConditionalAccessBlockedEvent{

    constructor(

        readonly principalId:string,

        readonly applicationId:string

    ){}

}
