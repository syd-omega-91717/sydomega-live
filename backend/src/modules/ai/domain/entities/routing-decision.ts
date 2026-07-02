// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/routing-decision.ts
// NEW FILE
// ============================================================================

import { RoutingPolicy }
from "../enums/routing-policy";

export class RoutingDecision{

    constructor(

        readonly routingId:string,

        readonly requestId:string,

        readonly policy:RoutingPolicy,

        readonly selectedProvider:string,

        readonly selectedModel:string,

        readonly score:number

    ){}

}
