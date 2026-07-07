// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/ZeroTrustEngine.ts
// ============================================================================

export class ZeroTrustEngine{

    verify(

        authenticated:boolean,

        authorized:boolean

    ){

        return authenticated

        && authorized;

    }

}
