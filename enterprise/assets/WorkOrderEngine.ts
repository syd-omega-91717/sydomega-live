// ============================================================================
// FILE:
// /enterprise/assets/WorkOrderEngine.ts
// ============================================================================

import { WorkOrder } from "./WorkOrder";

export class WorkOrderEngine{

    open(

        workOrder:WorkOrder

    ){

        workOrder.status="OPEN";

        return workOrder;

    }

    close(

        workOrder:WorkOrder

    ){

        workOrder.status="CLOSED";

        workOrder.completedAt=Date.now();

        return workOrder;

    }

}
