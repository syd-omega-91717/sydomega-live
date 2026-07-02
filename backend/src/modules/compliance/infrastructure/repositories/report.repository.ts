// ============================================================================
// FILE: /backend/src/modules/compliance/infrastructure/repositories/report.repository.ts
// NEW FILE
// ============================================================================

import { ReportAggregate }
from "../../domain/aggregates/report.aggregate";

export interface ReportRepository{

    save(

        aggregate:ReportAggregate

    ):Promise<void>;

    reports(

    ):Promise<ReportAggregate[]>;

}
