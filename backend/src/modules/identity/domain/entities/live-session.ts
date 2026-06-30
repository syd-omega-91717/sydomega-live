// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/live-session.ts
// NEW FILE
// ============================================================================

export class LiveSession{

    constructor(

        readonly sessionId:string,

        readonly userId:string,

        readonly deviceId:string,

        readonly ipAddress:string,

        readonly connectedAt:Date,

        readonly expiresAt:Date

    ){}

}
