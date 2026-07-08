// ============================================================================
// FILE:
// /enterprise/workflow/TaskEngine.ts
// ============================================================================

import { WorkflowTask } from "./WorkflowTask";

export class TaskEngine{

    assign(

        task:WorkflowTask,

        assignee:string

    ){

        task.assignee=assignee;

        return task;

    }

    complete(

        task:WorkflowTask

    ){

        task.status="COMPLETED";

        return task;

    }

}
