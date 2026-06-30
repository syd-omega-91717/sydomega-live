// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/anomalous-login-detected.event.ts
// NEW FILE
// ============================================================================

export class AnomalousLoginDetectedEvent{

    constructor(

        readonly userId:string,

        readonly score:number

    ){}

}
