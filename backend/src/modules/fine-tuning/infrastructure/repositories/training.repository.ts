// ============================================================================
// FILE: /backend/src/modules/fine-tuning/infrastructure/repositories/training.repository.ts
// NEW FILE
// ============================================================================

import { TrainingAggregate }
from "../../domain/aggregates/training.aggregate";

export interface TrainingRepository{

    save(

        aggregate:TrainingAggregate

    ):Promise<void>;

    find(

        trainingJobId:string

    ):Promise<TrainingAggregate|null>;

}
