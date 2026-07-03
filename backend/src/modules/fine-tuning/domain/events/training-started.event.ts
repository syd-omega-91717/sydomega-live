// ============================================================================
// FILE: /backend/src/modules/fine-tuning/domain/events/training-started.event.ts
// NEW FILE
// ============================================================================

export class TrainingStartedEvent{

    constructor(

        readonly trainingJobId:string,

        readonly baseModel:string

    ){}

}
