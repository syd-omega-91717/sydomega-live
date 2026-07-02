// ============================================================================
// FILE: /backend/src/modules/compliance/domain/events/certification-expiring.event.ts
// NEW FILE
// ============================================================================

export class CertificationExpiringEvent{

    constructor(

        readonly certificationId:string,

        readonly expirationDate:Date

    ){}

}
