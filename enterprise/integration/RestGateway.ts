// ============================================================================
// ENTERPRISE CORE EC-002
// FILE:
// /enterprise/integration/RestGateway.ts
// ============================================================================

export class RestGateway{

    async register(

        method:string,

        path:string,

        handler:Function

    ){

        return{

            protocol:"REST",

            method,

            path,

            handler

        };

    }

}
