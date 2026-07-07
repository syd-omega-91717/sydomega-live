// ============================================================================
// FILE:
// /frontend/features/digitalTwin/c4isr/WorkflowEngine.ts
// ============================================================================

export interface WorkflowStep{

    id:string;

    name:string;

    completed:boolean;

}

export class WorkflowEngine{

    execute(

        steps:WorkflowStep[]

    ){

        return steps.every(

            step=>step.completed

        );

    }

}
