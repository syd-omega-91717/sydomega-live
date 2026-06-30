// ============================================================================
// FILE: /backend/src/modules/identity/application/queries/identity-timeline.query.ts
// NEW FILE
// ============================================================================

export class IdentityTimelineQuery{

    constructor(

        readonly userId:string,

        readonly limit:number=100

    ){}

}
