// ============================================================================
// FILE: /backend/src/modules/cache/domain/entities/distributed-lock.ts
// NEW FILE
// ============================================================================

export class DistributedLock{

    constructor(

        readonly lockId:string,

        readonly resource:string,

        readonly owner:string,

        readonly expiresAt:Date

    ){}

}
