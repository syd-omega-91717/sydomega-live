// ============================================================================
// FILE:
// /enterprise/workflow/WorkflowInstance.ts
// ============================================================================

export interface WorkflowInstance{

    id:string;

    workflowId:string;

    status:string;

    initiatedBy:string;

    startedAt:number;

    completedAt?:number;

}
