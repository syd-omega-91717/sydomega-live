// ============================================================================
// FILE: /backend/src/modules/guardrails/domain/entities/content-scan.ts
// NEW FILE
// ============================================================================

export class ContentScan{

    constructor(

        readonly scanId:string,

        readonly promptHash:string,

        readonly piiDetected:boolean,

        readonly secretsDetected:boolean,

        readonly jailbreakDetected:boolean,

        readonly injectionDetected:boolean

    ){}

}
