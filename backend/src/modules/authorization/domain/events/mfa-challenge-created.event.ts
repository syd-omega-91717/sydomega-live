// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/mfa-challenge-created.event.ts
// NEW FILE
// ============================================================================

export class MfaChallengeCreatedEvent{

    constructor(

        readonly challengeId:string

    ){}

}
