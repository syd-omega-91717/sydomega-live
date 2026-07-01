// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/certification-item.ts
// NEW FILE
// ============================================================================

export class CertificationItem{

    constructor(

        readonly userId:string,

        readonly roleId:string,

        readonly ownerId:string,

        readonly approved:boolean|null,

        readonly reviewedAt:Date|null

    ){}

}
