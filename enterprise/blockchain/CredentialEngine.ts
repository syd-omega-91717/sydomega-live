// ============================================================================
// FILE:
// /enterprise/blockchain/CredentialEngine.ts
// ============================================================================

import { VerifiableCredential } from "./VerifiableCredential";

export class CredentialEngine{

    issue(

        credential:VerifiableCredential

    ){

        return{

            issued:true,

            credential

        };

    }

    verify(

        credentialId:string

    ){

        return{

            credentialId,

            valid:true

        };

    }

}
