// ============================================================================
// FILE: /backend/src/modules/compliance/application/services/reporting.service.ts
// NEW FILE
// ============================================================================

import { ComplianceReport }
from "../../domain/entities/compliance-report";

export interface ReportingService{

    generate(

        reportType:string

    ):Promise<ComplianceReport>;

    export(

        reportId:string

    ):Promise<void>;

}
