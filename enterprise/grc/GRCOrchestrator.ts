// ============================================================================
// FILE:
// /enterprise/grc/GRCOrchestrator.ts
// ============================================================================

import { AuditEngine } from "./AuditEngine";
import { ComplianceEngine } from "./ComplianceEngine";
import { EvidenceRepository } from "./EvidenceRepository";
import { ExceptionTrackingEngine } from "./ExceptionTrackingEngine";
import { GovernanceDashboardEngine } from "./GovernanceDashboardEngine";
import { RegulatoryReportingEngine } from "./RegulatoryReportingEngine";
import { RiskEngine } from "./RiskEngine";

export class GRCOrchestrator{

    readonly risks=

    new RiskEngine();

    readonly compliance=

    new ComplianceEngine();

    readonly audits=

    new AuditEngine();

    readonly evidence=

    new EvidenceRepository();

    readonly reporting=

    new RegulatoryReportingEngine();

    readonly exceptions=

    new ExceptionTrackingEngine();

    readonly dashboard=

    new GovernanceDashboardEngine();

}
