// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/oidc-provider.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { OidcProviderId }
from "../value-objects/oidc-provider-id";

export class OidcProviderAggregate
extends AggregateRoot<OidcProviderId>{

    issueIdToken(){}

    publishDiscovery(){}

    publishUserInfo(){}

    validateNonce(){}

}
