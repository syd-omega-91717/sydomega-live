// ============================================================================
// FILE: /backend/src/modules/oidc/domain/events/userinfo-requested.event.ts
// NEW FILE
// ============================================================================

export class UserInfoRequestedEvent {

    constructor(

        readonly subject: string

    ) {}

}
