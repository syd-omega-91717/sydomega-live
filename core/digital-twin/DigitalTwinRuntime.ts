// ============================================================================
// FILE:
// /core/digital-twin/DigitalTwinRuntime.ts
// ============================================================================

import { EventEngine } from "./EventEngine";
import { GISEngine } from "./GISEngine";
import { PredictiveEngine } from "./PredictiveEngine";
import { ScenarioEngine } from "./ScenarioEngine";
import { SimulationEngine } from "./SimulationEngine";
import { SynchronizationEngine } from "./SynchronizationEngine";
import { TelemetryEngine } from "./TelemetryEngine";
import { TwinRepository } from "./TwinRepository";
import { VisualizationAdapter } from "./VisualizationAdapter";

export class DigitalTwinRuntime{

    readonly repository=

    new TwinRepository();

    readonly telemetry=

    new TelemetryEngine();

    readonly gis=

    new GISEngine();

    readonly simulation=

    new SimulationEngine();

    readonly predictive=

    new PredictiveEngine();

    readonly scenarios=

    new ScenarioEngine();

    readonly events=

    new EventEngine();

    readonly synchronization=

    new SynchronizationEngine();

    readonly visualization=

    new VisualizationAdapter();

}
