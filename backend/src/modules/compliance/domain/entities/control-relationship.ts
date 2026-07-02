// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/control-relationship.ts
// NEW FILE
// ============================================================================

export class ControlRelationship{

    constructor(

        readonly relationshipId:string,

        readonly parentControl:string,

        readonly childControl:string,

        readonly relationshipType:string

    ){}

}
