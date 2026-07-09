// ============================================================================
// FILE:
// /enterprise/api/IntegrationMarketplaceEngine.ts
// ============================================================================

export class IntegrationMarketplaceEngine{

    publish(

        integrationId:string

    ){

        return{

            integrationId,

            available:true

        };

    }

}
