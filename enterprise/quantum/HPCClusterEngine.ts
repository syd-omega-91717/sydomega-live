// ============================================================================
// FILE:
// /enterprise/quantum/HPCClusterEngine.ts
// ============================================================================

import { HPCCluster } from "./HPCCluster";

export class HPCClusterEngine{

    allocate(

        cluster:HPCCluster

    ){

        return{

            allocated:true,

            cluster

        };

    }

}
