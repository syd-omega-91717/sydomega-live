// ============================================================================
// FILE: /backend/src/modules/object-storage/domain/entities/presigned-url.ts
// NEW FILE
// ============================================================================

export class PresignedUrl{

    constructor(

        readonly url:string,

        readonly expiresAt:Date,

        readonly method:string

    ){}

}
