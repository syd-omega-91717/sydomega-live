// ============================================================================
// FILE:
// /enterprise/commerce/ReturnsEngine.ts
// ============================================================================

export class ReturnsEngine{

    authorize(

        returnId:string

    ){

        return{

            returnId,

            authorized:true

        };

    }

}
