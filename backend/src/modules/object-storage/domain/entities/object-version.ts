// ============================================================================
// FILE: /backend/src/modules/object-storage/domain/entities/object-version.ts
// NEW FILE
// ============================================================================

export class ObjectVersion{

    constructor(

        readonly versionId:string,

        readonly objectId:string,

        readonly createdAt:Date,

        readonly current:boolean

    ){}

}
