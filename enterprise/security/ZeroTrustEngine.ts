// ============================================================================
// FILE:
// /enterprise/security/ZeroTrustEngine.ts
// ============================================================================

export class ZeroTrustEngine{

    authorize(

        identity:string,

        resource:string

    ){

        return{

            identity,

            resource,

            granted:true

        };

    }

}
