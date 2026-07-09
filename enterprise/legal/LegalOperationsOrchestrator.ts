// ============================================================================
// FILE:
// /enterprise/legal/LegalOperationsOrchestrator.ts
// ============================================================================

import { BoardManagementEngine } from "./BoardManagementEngine";
import { ClauseLibraryEngine } from "./ClauseLibraryEngine";
import { ContractLifecycleEngine } from "./ContractLifecycleEngine";
import { CorporateGovernanceEngine } from "./CorporateGovernanceEngine";
import { ESignatureEngine } from "./ESignatureEngine";
import { IntellectualPropertyEngine } from "./IntellectualPropertyEngine";
import { LegalCaseManagementEngine } from "./LegalCaseManagementEngine";
import { LitigationEngine } from "./LitigationEngine";
import { RegulatoryIntelligenceEngine } from "./RegulatoryIntelligenceEngine";

export class LegalOperationsOrchestrator{

    readonly contracts=new ContractLifecycleEngine();

    readonly cases=new LegalCaseManagementEngine();

    readonly clauses=new ClauseLibraryEngine();

    readonly signatures=new ESignatureEngine();

    readonly regulatory=new RegulatoryIntelligenceEngine();

    readonly intellectualProperty=new IntellectualPropertyEngine();

    readonly governance=new CorporateGovernanceEngine();

    readonly board=new BoardManagementEngine();

    readonly litigation=new LitigationEngine();

}
