// ============================================================================
// FILE:
// /enterprise/healthcare/EHREngine.ts
// ============================================================================

import { ElectronicHealthRecord } from "./ElectronicHealthRecord";

export class EHREngine{

    register(

        record:ElectronicHealthRecord

    ){

        return{

            stored:true,

            record

        };

    }

}
