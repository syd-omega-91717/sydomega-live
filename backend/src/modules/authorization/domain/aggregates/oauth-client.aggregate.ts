// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/oauth-client.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { OAuthClientId }
from "../value-objects/oauth-client-id";

export class OAuthClientAggregate
extends AggregateRoot<OAuthClientId>{

    register(){}

    rotateSecret(){}

    enable(){}

    disable(){}

    addRedirectUri(){}

}
