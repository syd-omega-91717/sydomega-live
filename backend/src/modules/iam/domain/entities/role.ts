// ============================================================================
// FILE: /backend/src/modules/iam/domain/entities/role.ts
// NEW FILE
// ============================================================================

export class Role{

    constructor(

        readonly roleId:string,

        readonly name:string,

        readonly permissions:string[],

        readonly system:boolean

    ){}

}
