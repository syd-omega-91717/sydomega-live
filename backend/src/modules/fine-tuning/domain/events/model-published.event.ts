// ============================================================================
// FILE: /backend/src/modules/fine-tuning/domain/events/model-published.event.ts
// NEW FILE
// ============================================================================

export class ModelPublishedEvent{

    constructor(

        readonly trainingJobId:string,

        readonly modelVersion:string

    ){}

}
