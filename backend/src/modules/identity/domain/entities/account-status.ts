// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/account-status.ts
// NEW FILE
// ============================================================================

export class AccountStatus{

    constructor(

        readonly locked:boolean,

        readonly suspended:boolean,

        readonly disabled:boolean,

        readonly mfaEnabled:boolean

    ){}

}
