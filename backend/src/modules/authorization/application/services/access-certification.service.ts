// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/access-certification.service.ts
// NEW FILE
// ============================================================================

import { AccessCertification }
from "../../domain/entities/access-certification";

export interface AccessCertificationService{

    active():Promise<AccessCertification[]>;

    overdue():Promise<AccessCertification[]>;

}
