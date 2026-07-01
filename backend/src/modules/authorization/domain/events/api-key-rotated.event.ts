// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/api-key-rotated.event.ts
// NEW FILE
// ============================================================================

export class ApiKeyRotatedEvent{

    constructor(

        readonly apiKeyId:string

    ){}

}
