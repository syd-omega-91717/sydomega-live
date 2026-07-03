// ============================================================================
// FILE: /backend/src/modules/fine-tuning/domain/entities/training-job.ts
// NEW FILE
// ============================================================================

import { TrainingJobId }
from "../value-objects/training-job-id";

import { TrainingStatus }
from "../enums/training-status";

export class TrainingJob{

    constructor(

        readonly id:TrainingJobId,

        readonly datasetId:string,

        readonly baseModel:string,

        readonly status:TrainingStatus,

        readonly epochs:number,

        readonly learningRate:number,

        readonly createdAt:Date

    ){}

}
