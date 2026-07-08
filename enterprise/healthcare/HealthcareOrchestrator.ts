// ============================================================================
// FILE:
// /enterprise/healthcare/HealthcareOrchestrator.ts
// ============================================================================

import { BiomedicalAnalyticsEngine } from "./BiomedicalAnalyticsEngine";
import { ClinicalDecisionSupportEngine } from "./ClinicalDecisionSupportEngine";
import { FHIRGateway } from "./FHIRGateway";
import { GenomicsEngine } from "./GenomicsEngine";
import { LaboratoryEngine } from "./LaboratoryEngine";
import { PACSEngine } from "./PACSEngine";
import { PatientDigitalTwinEngine } from "./PatientDigitalTwinEngine";
import { ProteomicsEngine } from "./ProteomicsEngine";

export class HealthcareOrchestrator{

    readonly fhir=

    new FHIRGateway();

    readonly pacs=

    new PACSEngine();

    readonly laboratory=

    new LaboratoryEngine();

    readonly genomics=

    new GenomicsEngine();

    readonly proteomics=

    new ProteomicsEngine();

    readonly clinicalDecision=

    new ClinicalDecisionSupportEngine();

    readonly analytics=

    new BiomedicalAnalyticsEngine();

    readonly patientTwin=

    new PatientDigitalTwinEngine();

}
