// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-request.ts
// NEW FILE
// ============================================================================

export class AccessRequest{

    constructor(

        readonly subjectId:string,

        readonly resource:string,

        readonly action:string,

        readonly attributes:Record<string,unknown>

    ){}

}
