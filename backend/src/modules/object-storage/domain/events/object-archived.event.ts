// ============================================================================
// FILE: /backend/src/modules/object-storage/domain/events/object-archived.event.ts
// NEW FILE
// ============================================================================

export class ObjectArchivedEvent{

    constructor(

        readonly objectId:string,

        readonly storageClass:string

    ){}

}
