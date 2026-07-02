// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/compliance-report.ts
// NEW FILE
// ============================================================================

import { ReportId }
from "../value-objects/report-id";

import { ReportType }
from "../enums/report-type";

import { ReportFormat }
from "../enums/report-format";

export class ComplianceReport{

    constructor(

        readonly id:ReportId,

        readonly organizationId:string,

        readonly type:ReportType,

        readonly format:ReportFormat,

        readonly generatedBy:string,

        readonly checksum:string,

        readonly generatedAt:Date

    ){}

}
