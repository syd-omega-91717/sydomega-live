// ============================================================================
// FILE: /backend/src/modules/zero-trust/domain/entities/security-session.ts
// NEW FILE
// ============================================================================

export class SecuritySession{

    constructor(

        readonly sessionId:string,

        readonly subjectId:string,

        readonly ipAddress:string,

        readonly riskScore:number,

        readonly authenticated:boolean

    ){}

}
