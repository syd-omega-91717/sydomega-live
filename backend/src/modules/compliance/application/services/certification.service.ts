// ============================================================================
// FILE: /backend/src/modules/compliance/application/services/certification.service.ts
// NEW FILE
// ============================================================================

import { Certification }
from "../../domain/entities/certification";

export interface CertificationService{

    issue(

        certificationId:string

    ):Promise<Certification>;

    renew(

        certificationId:string

    ):Promise<void>;

}
