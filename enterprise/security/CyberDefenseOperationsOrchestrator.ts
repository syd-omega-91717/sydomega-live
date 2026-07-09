// ============================================================================
// FILE:
// /enterprise/security/CyberDefenseOperationsOrchestrator.ts
// ============================================================================

import { AttackSurfaceManagementEngine } from "./AttackSurfaceManagementEngine";
import { DigitalForensicsEngine } from "./DigitalForensicsEngine";
import { EDREngine } from "./EDREngine";
import { MalwareAnalysisEngine } from "./MalwareAnalysisEngine";
import { SIEMEngine } from "./SIEMEngine";
import { SOAREngine } from "./SOAREngine";
import { ThreatIntelligenceEngine } from "./ThreatIntelligenceEngine";
import { VulnerabilityManagementEngine } from "./VulnerabilityManagementEngine";
import { XDREngine } from "./XDREngine";

export class CyberDefenseOperationsOrchestrator{

    readonly siem=new SIEMEngine();

    readonly soar=new SOAREngine();

    readonly intelligence=new ThreatIntelligenceEngine();

    readonly vulnerability=new VulnerabilityManagementEngine();

    readonly edr=new EDREngine();

    readonly xdr=new XDREngine();

    readonly forensics=new DigitalForensicsEngine();

    readonly malware=new MalwareAnalysisEngine();

    readonly attackSurface=new AttackSurfaceManagementEngine();

}
