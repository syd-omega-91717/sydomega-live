// ============================================================================
// FILE: /backend/src/modules/fine-tuning/application/services/training.service.ts
// NEW FILE
// ============================================================================

import { TrainingJob }
from "../../domain/entities/training-job";

export interface TrainingService{

    start(

        datasetId:string

    ):Promise<TrainingJob>;

    checkpoint(

        trainingJobId:string

    ):Promise<void>;

    publish(

        trainingJobId:string

    ):Promise<void>;

}
