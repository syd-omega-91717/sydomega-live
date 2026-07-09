// ============================================================================
// FILE:
// /enterprise/grc/GRCOperationsOrchestrator.ts
// ============================================================================

import { ComplianceEngine } from "./ComplianceEngine";
import { ContractLifecycleEngine } from "./ContractLifecycleEngine";
import { EnterpriseRiskManagementEngine } from "./EnterpriseRiskManagementEngine";
import { EthicsManagementEngine } from "./EthicsManagementEngine";
import { GovernanceEngine } from "./GovernanceEngine";
import { InternalAuditEngine } from "./InternalAuditEngine";
import { LegalCaseManagementEngine } from "./LegalCaseManagementEngine";
import { PolicyManagementEngine } from "./PolicyManagementEngine";
import { RecordsManagementEngine } from "./RecordsManagementEngine";

export class GRCOperationsOrchestrator{

    readonly governance=new GovernanceEngine();

    readonly policy=new PolicyManagementEngine();

    readonly compliance=new ComplianceEngine();

    readonly legal=new LegalCaseManagementEngine();

    readonly contracts=new ContractLifecycleEngine();

    readonly risk=new EnterpriseRiskManagementEngine();

    readonly audit=new InternalAuditEngine();

    readonly records=new RecordsManagementEngine();

    readonly ethics=new EthicsManagementEngine();

}
