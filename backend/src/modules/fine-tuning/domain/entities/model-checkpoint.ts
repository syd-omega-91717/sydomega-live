// ============================================================================
// FILE: /backend/src/modules/fine-tuning/domain/entities/model-checkpoint.ts
// NEW FILE
// ============================================================================

import { CheckpointStatus }
from "../enums/checkpoint-status";

export class ModelCheckpoint{

    constructor(

        readonly checkpointId:string,

        readonly trainingJobId:string,

        readonly epoch:number,

        readonly validationLoss:number,

        readonly status:CheckpointStatus

    ){}

}
