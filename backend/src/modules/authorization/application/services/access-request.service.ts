// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/access-request.service.ts
// NEW FILE
// ============================================================================

import { AccessRequestRecord }
from "../../domain/entities/access-request-record";

export interface AccessRequestService{

    pending():Promise<AccessRequestRecord[]>;

    mine(

        requesterId:string

    ):Promise<AccessRequestRecord[]>;

}
