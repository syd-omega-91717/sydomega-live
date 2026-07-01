// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/privileged-session.service.ts
// NEW FILE
// ============================================================================

import { PrivilegedSession }
from "../../domain/entities/privileged-session";

export interface PrivilegedSessionService{

    active():Promise<PrivilegedSession[]>;

    terminateExpired():Promise<void>;

}
