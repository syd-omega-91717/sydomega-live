// ============================================================================
// FILE: /backend/src/modules/governance/application/services/governance.service.ts
// NEW FILE
// ============================================================================

import { ComplianceReport }
from "../../domain/entities/compliance-report";

export interface GovernanceService{

    approve(

        modelId:string

    ):Promise<void>;

    report(

        framework:string

    ):Promise<ComplianceReport>;

    audit(

        requestId:string

    ):Promise<void>;

}
