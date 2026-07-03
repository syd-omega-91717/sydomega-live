// ============================================================================
// FILE: /backend/src/modules/api-gateway/domain/entities/api-route.ts
// NEW FILE
// ============================================================================

import { GatewayId }
from "../value-objects/gateway-id";

import { RouteStatus }
from "../enums/route-status";

export class ApiRoute{

    constructor(

        readonly id:GatewayId,

        readonly path:string,

        readonly upstream:string,

        readonly methods:string[],

        readonly authenticated:boolean,

        readonly status:RouteStatus

    ){}

}
