// ============================================================================
// FILE:
// /enterprise/security/CyberDefenseOrchestrator.ts
// ============================================================================

import { ComplianceMonitoringEngine } from "./ComplianceMonitoringEngine";
import { EDREngine } from "./EDREngine";
import { IncidentResponseEngine } from "./IncidentResponseEngine";
import { SecurityAnalyticsEngine } from "./SecurityAnalyticsEngine";
import { SIEMEngine } from "./SIEMEngine";
import { SOAREngine } from "./SOAREngine";
import { ThreatIntelligenceEngine } from "./ThreatIntelligenceEngine";
import { VulnerabilityEngine } from "./VulnerabilityEngine";
import { ZeroTrustEngine } from "./ZeroTrustEngine";

export class CyberDefenseOrchestrator{

    readonly siem=

    new SIEMEngine();

    readonly soar=

    new SOAREngine();

    readonly threatIntel=

    new ThreatIntelligenceEngine();

    readonly incidents=

    new IncidentResponseEngine();

    readonly vulnerabilities=

    new VulnerabilityEngine();

    readonly zeroTrust=

    new ZeroTrustEngine();

    readonly edr=

    new EDREngine();

    readonly analytics=

    new SecurityAnalyticsEngine();

    readonly compliance=

    new ComplianceMonitoringEngine();

}
