// ============================================================================
// FILE: /backend/src/modules/object-storage/domain/entities/storage-bucket.ts
// NEW FILE
// ============================================================================

export class StorageBucket{

    constructor(

        readonly bucketId:string,

        readonly name:string,

        readonly region:string,

        readonly versioning:boolean,

        readonly encryption:boolean,

        readonly objectLock:boolean

    ){}

}
