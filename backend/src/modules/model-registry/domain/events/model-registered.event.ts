// ============================================================================
// FILE: /backend/src/modules/model-registry/domain/events/model-registered.event.ts
// NEW FILE
// ============================================================================

export class ModelRegisteredEvent{

    constructor(

        readonly modelId:string,

        readonly version:string

    ){}

}
