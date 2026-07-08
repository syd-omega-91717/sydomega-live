// ============================================================================
// FILE:
// /enterprise/assets/WorkOrder.ts
// ============================================================================

export interface WorkOrder{

    id:string;

    assetId:string;

    title:string;

    description:string;

    assignedTo:string;

    priority:string;

    status:string;

    createdAt:number;

    completedAt?:number;

}
