// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/jit-session.ts
// NEW FILE
// ============================================================================

export class JitSession{

    constructor(

        readonly sessionId:string,

        readonly jitAccessId:string,

        readonly startedAt:Date|null,

        readonly endedAt:Date|null,

        readonly active:boolean

    ){}

}
