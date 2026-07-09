// ============================================================================
// FILE:
// /enterprise/iot/EdgeComputingRuntimeEngine.ts
// ============================================================================

import { EdgeNode } from "./EdgeNode";

export class EdgeComputingRuntimeEngine{

    deploy(

        node:EdgeNode

    ){

        return{

            node,

            deployed:true

        };

    }

}
