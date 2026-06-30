// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/session-stream.repository.ts
// NEW FILE
// ============================================================================

import { SessionStreamAggregate }
from "../../domain/aggregates/session-stream.aggregate";

export interface SessionStreamRepository{

    save(

        aggregate:SessionStreamAggregate

    ):Promise<void>;

    find(

        sessionId:string

    ):Promise<SessionStreamAggregate|null>;

}
