// ============================================================================
// FILE:
// /enterprise/data/EnterpriseDataLakeEngine.ts
// ============================================================================

import { DataLake } from "./DataLake";

export class EnterpriseDataLakeEngine{

    register(

        lake:DataLake

    ){

        return{

            lake,

            registered:true

        };

    }

}
