// ============================================================================
// FILE:
// /enterprise/defense/NationalSecurityOrchestrator.ts
// ============================================================================

import { BorderSecurityEngine } from "./BorderSecurityEngine";
import { CriticalInfrastructureProtectionEngine } from "./CriticalInfrastructureProtectionEngine";
import { EmergencyOperationsCenterEngine } from "./EmergencyOperationsCenterEngine";
import { GeospatialIntelligenceEngine } from "./GeospatialIntelligenceEngine";
import { HomelandSecurityEngine } from "./HomelandSecurityEngine";
import { IncidentCommandEngine } from "./IncidentCommandEngine";
import { IntelligenceFusionCenterEngine } from "./IntelligenceFusionCenterEngine";
import { NationalCommandEngine } from "./NationalCommandEngine";
import { ThreatIntelligenceEngine } from "./ThreatIntelligenceEngine";

export class NationalSecurityOrchestrator{

    readonly command=

    new NationalCommandEngine();

    readonly homeland=

    new HomelandSecurityEngine();

    readonly border=

    new BorderSecurityEngine();

    readonly infrastructure=

    new CriticalInfrastructureProtectionEngine();

    readonly incident=

    new IncidentCommandEngine();

    readonly eoc=

    new EmergencyOperationsCenterEngine();

    readonly fusion=

    new IntelligenceFusionCenterEngine();

    readonly geoint=

    new GeospatialIntelligenceEngine();

    readonly threat=

    new ThreatIntelligenceEngine();

}
