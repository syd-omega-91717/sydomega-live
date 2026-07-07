// ============================================================================
// FILE:
// /core/governance/GovernanceEngine.ts
// ============================================================================

import { EmpowermentEngine } from "./EmpowermentEngine";
import { KnowledgeEngine } from "./KnowledgeEngine";
import { InterconnectionEngine } from "./InterconnectionEngine";
import { AdministrationEngine } from "./AdministrationEngine";
import { InformationEngine } from "./InformationEngine";
import { DiplomacyEngine } from "./DiplomacyEngine";
import { PowerEngine } from "./PowerEngine";
import { ValidationEngine } from "./ValidationEngine";
import { GuidanceEngine } from "./GuidanceEngine";
import { GovernanceAudit } from "./GovernanceAudit";

export class GovernanceEngine{

    readonly empowerment=

    new EmpowermentEngine();

    readonly knowledge=

    new KnowledgeEngine();

    readonly interconnection=

    new InterconnectionEngine();

    readonly administration=

    new AdministrationEngine();

    readonly information=

    new InformationEngine();

    readonly diplomacy=

    new DiplomacyEngine();

    readonly power=

    new PowerEngine();

    readonly validation=

    new ValidationEngine();

    readonly guidance=

    new GuidanceEngine();

    readonly audit=

    new GovernanceAudit();

}
