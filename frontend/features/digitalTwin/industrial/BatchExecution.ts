// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/BatchExecution.ts
// ============================================================================

export interface BatchJob{

    id:string;

    recipeId:string;

    status:string;

}

export class BatchExecution{

    start(

        recipeId:string

    ):BatchJob{

        return{

            id:crypto.randomUUID(),

            recipeId,

            status:"RUNNING"

        };

    }

}
