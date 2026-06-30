// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/api-key-created.event.ts
// NEW FILE
// ============================================================================

export class ApiKeyCreatedEvent {

    constructor(

        readonly apiKeyId:string,

        readonly ownerId:string

    ){}

}
