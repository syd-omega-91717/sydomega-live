// ============================================================================
// FILE:
// /enterprise/identity/ZeroTrustIdentityEngine.ts
// ============================================================================

export class ZeroTrustIdentityEngine{

    authorize(

        identityId:string,

        resourceId:string

    ){

        return{

            identityId,

            resourceId,

            authorized:true

        };

    }

}
