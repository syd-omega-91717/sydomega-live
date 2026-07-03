// ============================================================================
// FILE: /backend/src/modules/fine-tuning/application/commands/start-training.command.ts
// NEW FILE
// ============================================================================

export class StartTrainingCommand{

    constructor(

        readonly datasetId:string,

        readonly baseModel:string

    ){}

}
