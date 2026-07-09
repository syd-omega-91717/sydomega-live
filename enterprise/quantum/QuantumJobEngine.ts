// ============================================================================
// FILE:
// /enterprise/quantum/QuantumJobEngine.ts
// ============================================================================

import { QuantumJob } from "./QuantumJob";

export class QuantumJobEngine{

    submit(

        job:QuantumJob

    ){

        return{

            accepted:true,

            job

        };

    }

}
