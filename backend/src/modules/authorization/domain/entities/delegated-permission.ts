// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/delegated-permission.ts
// NEW FILE
// ============================================================================

export class DelegatedPermission{

    constructor(

        readonly resource:string,

        readonly action:string,

        readonly constraints:Record<string,unknown>

    ){}

}
