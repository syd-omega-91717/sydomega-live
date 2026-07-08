// ============================================================================
// FILE:
// /enterprise/digital-twin/InfrastructureOrchestrator.ts
// ============================================================================

import { BIMSynchronizationEngine } from "./BIMSynchronizationEngine";
import { DigitalTwinRegistry } from "./DigitalTwinRegistry";
import { EnergyOptimizationEngine } from "./EnergyOptimizationEngine";
import { FacilitySimulationEngine } from "./FacilitySimulationEngine";
import { GISEngine } from "./GISEngine";
import { PredictiveMaintenanceAI } from "./PredictiveMaintenanceAI";
import { SensorFusionEngine } from "./SensorFusionEngine";
import { TelemetryEngine } from "./TelemetryEngine";
import { ThreeDVisualizationEngine } from "./ThreeDVisualizationEngine";

export class InfrastructureOrchestrator{

    readonly registry=

    new DigitalTwinRegistry();

    readonly bim=

    new BIMSynchronizationEngine();

    readonly gis=

    new GISEngine();

    readonly telemetry=

    new TelemetryEngine();

    readonly sensors=

    new SensorFusionEngine();

    readonly visualization=

    new ThreeDVisualizationEngine();

    readonly predictiveAI=

    new PredictiveMaintenanceAI();

    readonly simulation=

    new FacilitySimulationEngine();

    readonly energy=

    new EnergyOptimizationEngine();

}
