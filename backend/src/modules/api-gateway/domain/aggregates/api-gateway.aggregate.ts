// ============================================================================
// FILE: /backend/src/modules/api-gateway/domain/aggregates/api-gateway.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { GatewayId }
from "../value-objects/gateway-id";

export class ApiGatewayAggregate
extends AggregateRoot<GatewayId>{

    authenticate(){}

    authorize(){}

    route(){}

    throttle(){}

    log(){}

}
