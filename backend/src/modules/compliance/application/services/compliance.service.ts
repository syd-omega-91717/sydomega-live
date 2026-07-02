// ============================================================================
// FILE: /backend/src/modules/compliance/application/services/compliance.service.ts
// NEW FILE
// ============================================================================

import { ComplianceControl }
from "../../domain/entities/compliance-control";

export interface ComplianceService{

    evaluate(

        controlId:string

    ):Promise<boolean>;

    evidence(

        controlId:string

    ):Promise<number>;

}
