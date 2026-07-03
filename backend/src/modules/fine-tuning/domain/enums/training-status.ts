// ============================================================================
// FILE: /backend/src/modules/fine-tuning/domain/enums/training-status.ts
// NEW FILE
// ============================================================================

export enum TrainingStatus{

    Created="CREATED",

    Queued="QUEUED",

    Preparing="PREPARING",

    Training="TRAINING",

    Evaluating="EVALUATING",

    Publishing="PUBLISHING",

    Completed="COMPLETED",

    Failed="FAILED",

    Cancelled="CANCELLED"

}
