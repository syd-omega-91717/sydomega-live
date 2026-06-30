// ============================================================================
// FILE: /backend/src/modules/saml/domain/aggregates/saml-session.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot } from "@/kernel/domain/aggregate-root";
import { SessionId } from "@/modules/identity/domain/value-objects/session-id";

export class SamlSessionAggregate
extends AggregateRoot<SessionId>{

    createAssertion(){}

    validateAssertion(){}

    terminateSession(){}

}
