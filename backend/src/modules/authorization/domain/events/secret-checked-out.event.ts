// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/secret-checked-out.event.ts
// NEW FILE
// ============================================================================

export class SecretCheckedOutEvent{

    constructor(

        readonly secretId:string,

        readonly principalId:string

    ){}

}
