// ============================================================================
// FILE: /backend/src/modules/digital-twin/domain/entities/twin-relationship.ts
// NEW FILE
// ============================================================================

export class TwinRelationship{

    constructor(

        readonly relationshipId:string,

        readonly sourceTwin:string,

        readonly targetTwin:string,

        readonly relationshipType:string

    ){}

}
