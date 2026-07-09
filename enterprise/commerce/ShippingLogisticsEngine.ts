// ============================================================================
// FILE:
// /enterprise/commerce/ShippingLogisticsEngine.ts
// ============================================================================

export class ShippingLogisticsEngine{

    dispatch(

        shipmentId:string

    ){

        return{

            shipmentId,

            dispatched:true

        };

    }

}
