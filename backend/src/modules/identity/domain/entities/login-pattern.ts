// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/login-pattern.ts
// NEW FILE
// ============================================================================

export class LoginPattern{

    constructor(

        readonly hour:number,

        readonly weekday:number,

        readonly probability:number

    ){}

}
