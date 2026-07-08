// ============================================================================
// FILE:
// /enterprise/defense/BorderSecurityEngine.ts
// ============================================================================

import { BorderCheckpoint } from "./BorderCheckpoint";

export class BorderSecurityEngine{

    inspect(

        checkpoint:BorderCheckpoint

    ){

        return{

            checkpoint,

            inspectionCompleted:true

        };

    }

}
