// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/secret-rotated.event.ts
// NEW FILE
// ============================================================================

export class SecretRotatedEvent{

    constructor(

        readonly secretId:string

    ){}

}
