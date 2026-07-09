// ============================================================================
// FILE:
// /enterprise/commerce/OrderManagementEngine.ts
// ============================================================================

import { SalesOrder } from "./SalesOrder";

export class OrderManagementEngine{

    process(

        order:SalesOrder

    ){

        return{

            order,

            processed:true

        };

    }

}
