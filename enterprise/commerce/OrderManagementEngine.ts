// ============================================================================
// FILE:
// /enterprise/commerce/OrderManagementEngine.ts
// ============================================================================

import { Order } from "./Order";

export class OrderManagementEngine{

    process(

        order:Order

    ){

        order.status="PROCESSING";

        return order;

    }

}
