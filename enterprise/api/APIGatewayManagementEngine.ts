// ============================================================================
// FILE:
// /enterprise/api/APIGatewayManagementEngine.ts
// ============================================================================

import { APIService } from "./APIService";

export class APIGatewayManagementEngine{

    publish(

        api:APIService

    ){

        return{

            api,

            published:true

        };

    }

}
