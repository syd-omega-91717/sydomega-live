// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/authentication-metric.ts
// NEW FILE
// ============================================================================

export class AuthenticationMetric{

    constructor(

        readonly timestamp:Date,

        readonly succeeded:boolean,

        readonly riskScore:number,

        readonly duration:number

    ){}

}
