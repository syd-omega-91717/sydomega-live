// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/requested-role.ts
// NEW FILE
// ============================================================================

export class RequestedRole{

    constructor(

        readonly roleId:string,

        readonly justification:string,

        readonly expiresAt:Date|null

    ){}

}
