// ============================================================================
// FILE:
// /enterprise/identity/IdentityLifecycleEngine.ts
// ============================================================================

export class IdentityLifecycleEngine{

    activate(

        identityId:string

    ){

        return{

            identityId,

            activated:true

        };

    }

}
