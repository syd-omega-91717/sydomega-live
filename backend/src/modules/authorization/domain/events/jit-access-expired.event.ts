// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/jit-access-expired.event.ts
// NEW FILE
// ============================================================================

export class JitAccessExpiredEvent{

    constructor(

        readonly jitAccessId:string

    ){}

}
