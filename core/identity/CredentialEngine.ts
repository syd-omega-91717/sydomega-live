// ============================================================================
// FILE:
// /core/identity/CredentialEngine.ts
// ============================================================================

import { IdentityCredential } from "./IdentityCredential";

export class CredentialEngine{

    issue(

        credential:IdentityCredential

    ){

        return{

            ...credential,

            active:true

        };

    }

}
