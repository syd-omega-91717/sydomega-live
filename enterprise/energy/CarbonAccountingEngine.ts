// ============================================================================
// FILE:
// /enterprise/energy/CarbonAccountingEngine.ts
// ============================================================================

import { CarbonRecord } from "./CarbonRecord";

export class CarbonAccountingEngine{

    calculate(

        record:CarbonRecord

    ){

        return{

            record,

            verified:true

        };

    }

}
