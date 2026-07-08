// ============================================================================
// FILE:
// /enterprise/workflow/WorkflowTask.ts
// ============================================================================

export interface WorkflowTask{

    id:string;

    workflowInstanceId:string;

    assignee:string;

    title:string;

    status:string;

    priority:string;

}
