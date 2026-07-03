// ============================================================================
// FILE: /backend/src/modules/object-storage/domain/events/object-uploaded.event.ts
// NEW FILE
// ============================================================================

export class ObjectUploadedEvent{

    constructor(

        readonly objectId:string,

        readonly bucket:string

    ){}

}
