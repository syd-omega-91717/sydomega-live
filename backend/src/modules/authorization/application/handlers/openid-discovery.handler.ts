// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/openid-discovery.handler.ts
// NEW FILE
// ============================================================================

import { QueryHandler }
from "@/kernel/cqrs";

import { OpenIdDiscoveryQuery }
from "../queries/openid-discovery.query";

export class OpenIdDiscoveryHandler
implements QueryHandler<OpenIdDiscoveryQuery>{

    async execute(){

        // Build Discovery Metadata

    }

}
