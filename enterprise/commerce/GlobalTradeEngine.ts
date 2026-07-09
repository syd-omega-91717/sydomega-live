// ============================================================================
// FILE:
// /enterprise/commerce/GlobalTradeEngine.ts
// ============================================================================

export class GlobalTradeEngine{

    clearCustoms(

        shipmentId:string

    ){

        return{

            shipmentId,

            customsCleared:true

        };

    }

}
