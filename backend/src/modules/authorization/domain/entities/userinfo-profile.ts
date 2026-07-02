// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/userinfo-profile.ts
// NEW FILE
// ============================================================================

export class UserInfoProfile{

    constructor(

        readonly subject:string,

        readonly name:string,

        readonly givenName:string,

        readonly familyName:string,

        readonly preferredUsername:string,

        readonly email:string,

        readonly emailVerified:boolean,

        readonly picture:string|null

    ){}

}
