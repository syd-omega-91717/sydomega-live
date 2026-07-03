// ============================================================================
// FILE: /backend/src/modules/fine-tuning/domain/entities/training-experiment.ts
// NEW FILE
// ============================================================================

export class TrainingExperiment{

    constructor(

        readonly experimentId:string,

        readonly trainingJobId:string,

        readonly parameters:Record<string,unknown>,

        readonly metrics:Record<string,number>

    ){}

}
