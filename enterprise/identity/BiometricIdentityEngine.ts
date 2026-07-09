// ============================================================================
// FILE:
// /enterprise/identity/BiometricIdentityEngine.ts
// ============================================================================

import { BiometricProfile } from "./BiometricProfile";

export class BiometricIdentityEngine{

    verify(

        profile:BiometricProfile

    ){

        return{

            profile,

            verified:true

        };

    }

}
