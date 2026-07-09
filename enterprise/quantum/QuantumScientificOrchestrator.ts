// ============================================================================
// FILE:
// /enterprise/quantum/QuantumScientificOrchestrator.ts
// ============================================================================

import { DigitalResearchLaboratory } from "./DigitalResearchLaboratory";
import { DistributedComputingEngine } from "./DistributedComputingEngine";
import { HPCClusterEngine } from "./HPCClusterEngine";
import { MathematicalAnalyticsEngine } from "./MathematicalAnalyticsEngine";
import { OptimizationEngine } from "./OptimizationEngine";
import { QuantumCircuitEngine } from "./QuantumCircuitEngine";
import { QuantumJobEngine } from "./QuantumJobEngine";
import { ScientificWorkflowEngine } from "./ScientificWorkflowEngine";
import { SimulationEngine } from "./SimulationEngine";

export class QuantumScientificOrchestrator{

    readonly quantum=

    new QuantumJobEngine();

    readonly circuits=

    new QuantumCircuitEngine();

    readonly hpc=

    new HPCClusterEngine();

    readonly distributed=

    new DistributedComputingEngine();

    readonly simulation=

    new SimulationEngine();

    readonly optimization=

    new OptimizationEngine();

    readonly workflows=

    new ScientificWorkflowEngine();

    readonly mathematics=

    new MathematicalAnalyticsEngine();

    readonly laboratory=

    new DigitalResearchLaboratory();

}
