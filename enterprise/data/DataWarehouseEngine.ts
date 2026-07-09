// ============================================================================
// FILE:
// /enterprise/data/DataWarehouseEngine.ts
// ============================================================================

import { DataWarehouse } from "./DataWarehouse";

export class DataWarehouseEngine{

    synchronize(

        warehouse:DataWarehouse

    ){

        return{

            warehouse,

            synchronized:true

        };

    }

}
