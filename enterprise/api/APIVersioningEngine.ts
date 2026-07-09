// ============================================================================
// FILE:
// /enterprise/api/APIVersioningEngine.ts
// ============================================================================

export class APIVersioningEngine{

    createVersion(

        apiId:string,

        version:string

    ){

        return{

            apiId,

            version,

            created:true

        };

    }

}
