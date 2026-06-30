// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/service-account-secret-rotated.event.ts
// NEW FILE
// ============================================================================

export class ServiceAccountSecretRotatedEvent{

    constructor(

        readonly serviceAccountId:string

    ){}

}
