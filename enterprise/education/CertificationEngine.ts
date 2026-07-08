// ============================================================================
// FILE:
// /enterprise/education/CertificationEngine.ts
// ============================================================================

import { Certificate } from "./Certificate";

export class CertificationEngine{

    issue(

        certificate:Certificate

    ){

        return{

            issued:true,

            certificate

        };

    }

}
