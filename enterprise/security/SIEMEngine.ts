// ============================================================================
// FILE:
// /enterprise/security/SIEMEngine.ts
// ============================================================================

import { SIEMEvent } from "./SIEMEvent";

export class SIEMEngine{

    ingest(

        event:SIEMEvent

    ){

        return{

            accepted:true,

            event

        };

    }

}
