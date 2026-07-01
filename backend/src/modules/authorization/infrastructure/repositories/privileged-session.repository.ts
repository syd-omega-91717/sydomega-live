// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/privileged-session.repository.ts
// NEW FILE
// ============================================================================

import { PrivilegedSessionAggregate }
from "../../domain/aggregates/privileged-session.aggregate";

export interface PrivilegedSessionRepository{

    save(

        aggregate:PrivilegedSessionAggregate

    ):Promise<void>;

    find(

        sessionId:string

    ):Promise<PrivilegedSessionAggregate|null>;

    active(

    ):Promise<PrivilegedSessionAggregate[]>;

}
