// ============================================================================
// FILE:
// /enterprise/api/APICatalogEngine.ts
// ============================================================================

export class APICatalogEngine{

    register(

        apiId:string

    ){

        return{

            apiId,

            catalogued:true

        };

    }

}
