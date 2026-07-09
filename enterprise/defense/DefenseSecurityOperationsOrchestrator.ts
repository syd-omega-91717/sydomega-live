// ============================================================================
// FILE:
// /enterprise/defense/DefenseSecurityOperationsOrchestrator.ts
// ============================================================================

import { BorderSecurityEngine } from "./BorderSecurityEngine";
import { CommandControlEngine } from "./CommandControlEngine";
import { CriticalInfrastructureProtectionEngine } from "./CriticalInfrastructureProtectionEngine";
import { CyberDefenseEngine } from "./CyberDefenseEngine";
import { EmergencyCommunicationsEngine } from "./EmergencyCommunicationsEngine";
import { IncidentCommandEngine } from "./IncidentCommandEngine";
import { IntelligenceFusionEngine } from "./IntelligenceFusionEngine";
import { StrategicIntelligenceAnalyticsEngine } from "./StrategicIntelligenceAnalyticsEngine";
import { ThreatIntelligenceEngine } from "./ThreatIntelligenceEngine";

export class DefenseSecurityOperationsOrchestrator{

    readonly command=new CommandControlEngine();

    readonly fusion=new IntelligenceFusionEngine();

    readonly threats=new ThreatIntelligenceEngine();

    readonly cyber=new CyberDefenseEngine();

    readonly border=new BorderSecurityEngine();

    readonly infrastructure=new CriticalInfrastructureProtectionEngine();

    readonly incidents=new IncidentCommandEngine();

    readonly communications=new EmergencyCommunicationsEngine();

    readonly analytics=new StrategicIntelligenceAnalyticsEngine();

}
