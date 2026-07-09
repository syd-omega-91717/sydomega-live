// ============================================================================
// FILE:
// /enterprise/healthcare/HealthcareLifeSciencesOrchestrator.ts
// ============================================================================

import { BioinformaticsEngine } from "./BioinformaticsEngine";
import { ClinicalDecisionSupportEngine } from "./ClinicalDecisionSupportEngine";
import { DrugDiscoveryEngine } from "./DrugDiscoveryEngine";
import { EHREngine } from "./EHREngine";
import { HospitalInformationSystemEngine } from "./HospitalInformationSystemEngine";
import { LIMSEngine } from "./LIMSEngine";
import { PACSEngine } from "./PACSEngine";
import { PrecisionMedicineEngine } from "./PrecisionMedicineEngine";
import { PublicHealthIntelligenceEngine } from "./PublicHealthIntelligenceEngine";

export class HealthcareLifeSciencesOrchestrator{

    readonly ehr=

    new EHREngine();

    readonly his=

    new HospitalInformationSystemEngine();

    readonly lims=

    new LIMSEngine();

    readonly pacs=

    new PACSEngine();

    readonly bioinformatics=

    new BioinformaticsEngine();

    readonly cdss=

    new ClinicalDecisionSupportEngine();

    readonly drugDiscovery=

    new DrugDiscoveryEngine();

    readonly publicHealth=

    new PublicHealthIntelligenceEngine();

    readonly precisionMedicine=

    new PrecisionMedicineEngine();

}
