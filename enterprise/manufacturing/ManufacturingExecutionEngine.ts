// ============================================================================
// FILE:
// /enterprise/manufacturing/ManufacturingExecutionEngine.ts
// ============================================================================

import { ProductionOrder } from "./ProductionOrder";

export class ManufacturingExecutionEngine{

    execute(

        order:ProductionOrder

    ){

        return{

            order,

            started:true

        };

    }

}
