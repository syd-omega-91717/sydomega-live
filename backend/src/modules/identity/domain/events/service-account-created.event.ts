// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/service-account-created.event.ts
// NEW FILE
// ============================================================================

export class ServiceAccountCreatedEvent{

    constructor(

        readonly serviceAccountId:string,

        readonly ownerId:string

    ){}

}
