// ============================================================================
// FILE:
// /enterprise/commerce/FulfillmentEngine.ts
// ============================================================================

export class FulfillmentEngine{

    dispatch(

        orderId:string

    ){

        return{

            orderId,

            dispatched:true

        };

    }

}
