// ============================================================================
// FILE:
// /enterprise/space/SpaceOperationsOrchestrator.ts
// ============================================================================

import { DeepSpaceMissionControlEngine } from "./DeepSpaceMissionControlEngine";
import { EarthObservationEngine } from "./EarthObservationEngine";
import { GroundStationEngine } from "./GroundStationEngine";
import { MissionPlanningEngine } from "./MissionPlanningEngine";
import { OrbitalMechanicsEngine } from "./OrbitalMechanicsEngine";
import { RemoteSensingEngine } from "./RemoteSensingEngine";
import { SatelliteFleetEngine } from "./SatelliteFleetEngine";
import { SpaceSituationalAwarenessEngine } from "./SpaceSituationalAwarenessEngine";
import { TelemetryEngine } from "./TelemetryEngine";

export class SpaceOperationsOrchestrator{

    readonly fleet=

    new SatelliteFleetEngine();

    readonly missions=

    new MissionPlanningEngine();

    readonly orbital=

    new OrbitalMechanicsEngine();

    readonly ground=

    new GroundStationEngine();

    readonly telemetry=

    new TelemetryEngine();

    readonly sensing=

    new RemoteSensingEngine();

    readonly observation=

    new EarthObservationEngine();

    readonly awareness=

    new SpaceSituationalAwarenessEngine();

    readonly deepSpace=

    new DeepSpaceMissionControlEngine();

}
