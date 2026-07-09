// ============================================================================
// FILE:
// /enterprise/identity/VerifiableCredentialEngine.ts
// ============================================================================

import { VerifiableCredential } from "./VerifiableCredential";

export class VerifiableCredentialEngine{

    issue(

        credential:VerifiableCredential

    ){

        return{

            credential,

            issued:true

        };

    }

}
