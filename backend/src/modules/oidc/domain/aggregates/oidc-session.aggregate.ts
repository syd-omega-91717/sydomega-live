// ============================================================================
// FILE: /backend/src/modules/oidc/domain/aggregates/oidc-session.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot } from "@/kernel/domain/aggregate-root";
import { SessionId } from "@/modules/identity/domain/value-objects/session-id";

export class OidcSessionAggregate
extends AggregateRoot<SessionId>{

    issueIdToken(){}

    revoke(){}

    logout(){}

}
