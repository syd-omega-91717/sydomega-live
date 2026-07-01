// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/session.repository.ts
// NEW FILE
// ============================================================================

import { SessionAggregate }
from "../../domain/aggregates/session.aggregate";

export interface SessionRepository{

    save(

        aggregate:SessionAggregate

    ):Promise<void>;

    find(

        sessionId:string

    ):Promise<SessionAggregate|null>;

    active(

        principalId:string

    ):Promise<SessionAggregate[]>;

}
