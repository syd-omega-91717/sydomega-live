// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/service-account-secret-rotated.event.ts
// NEW FILE
// ============================================================================

export class ServiceAccountSecretRotatedEvent{

    constructor(

        readonly serviceAccountId:string

    ){}

}
