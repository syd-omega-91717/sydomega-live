// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/security-metric.ts
// NEW FILE
// ============================================================================

export class SecurityMetric{

    constructor(

        readonly failedLogins:number,

        readonly mfaChallenges:number,

        readonly accountLockouts:number,

        readonly apiKeyUsage:number

    ){}

}
