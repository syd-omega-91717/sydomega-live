// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/compliance-alert.ts
// NEW FILE
// ============================================================================

export class ComplianceAlert{

    constructor(

        readonly alertId:string,

        readonly controlId:string,

        readonly severity:string,

        readonly message:string,

        readonly acknowledged:boolean,

        readonly createdAt:Date

    ){}

}
