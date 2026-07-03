// ============================================================================
// FILE: /backend/src/modules/fine-tuning/domain/aggregates/training.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { TrainingJobId }
from "../value-objects/training-job-id";

export class TrainingAggregate
extends AggregateRoot<TrainingJobId>{

    validateDataset(){}

    scheduleTraining(){}

    createCheckpoint(){}

    evaluateModel(){}

    publishModel(){}

}
