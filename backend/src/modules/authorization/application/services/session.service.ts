// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/session.service.ts
// NEW FILE
// ============================================================================

import { UserSession }
from "../../domain/entities/user-session";

export interface SessionService{

    active(

        principalId:string

    ):Promise<UserSession[]>;

    revoke(

        sessionId:string

    ):Promise<void>;

}
