// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/user-profile.ts
// NEW FILE
// ============================================================================

export class UserProfile {

    constructor(

        readonly firstName:string,

        readonly lastName:string,

        readonly avatar?:string,

        readonly timezone?:string,

        readonly locale?:string

    ){}

}
