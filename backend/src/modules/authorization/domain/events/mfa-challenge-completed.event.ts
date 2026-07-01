// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/mfa-challenge-completed.event.ts
// NEW FILE
// ============================================================================

export class MfaChallengeCompletedEvent{

    constructor(

        readonly challengeId:string

    ){}

}
