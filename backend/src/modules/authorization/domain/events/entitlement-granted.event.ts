// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/entitlement-granted.event.ts
// NEW FILE
// ============================================================================

export class EntitlementGrantedEvent{

    constructor(

        readonly entitlementId:string,

        readonly principalId:string

    ){}

}
