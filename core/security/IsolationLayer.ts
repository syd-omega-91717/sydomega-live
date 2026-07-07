// ============================================================================
// FILE:
// /core/security/IsolationLayer.ts
// ============================================================================

export class IsolationLayer{

    isolate(

        resource:string

    ){

        return{

            resource,

            isolated:true

        };

    }

}
