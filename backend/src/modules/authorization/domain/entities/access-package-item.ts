// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-package-item.ts
// NEW FILE
// ============================================================================

export class AccessPackageItem{

    constructor(

        readonly roleId:string,

        readonly entitlementIds:string[],

        readonly required:boolean

    ){}

}
