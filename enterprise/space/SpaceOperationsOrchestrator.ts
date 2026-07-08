// ============================================================================
// FILE:
// /enterprise/space/SpaceOperationsOrchestrator.ts
// ============================================================================

import { EarthObservationEngine } from "./EarthObservationEngine";
import { GEOINTEngine } from "./GEOINTEngine";
import { GlobalInfrastructureMonitoringEngine } from "./GlobalInfrastructureMonitoringEngine";
import { GNSSEngine } from "./GNSSEngine";
import { OrbitalAssetManager } from "./OrbitalAssetManager";
import { RemoteSensingEngine } from "./RemoteSensingEngine";
import { SatelliteTelemetryEngine } from "./SatelliteTelemetryEngine";
import { SIGINTEngine } from "./SIGINTEngine";
import { SpaceCommunicationEngine } from "./SpaceCommunicationEngine";

export class SpaceOperationsOrchestrator{

    readonly telemetry=

    new SatelliteTelemetryEngine();

    readonly assets=

    new OrbitalAssetManager();

    readonly gnss=

    new GNSSEngine();

    readonly earthObservation=

    new EarthObservationEngine();

    readonly remoteSensing=

    new RemoteSensingEngine();

    readonly geoint=

    new GEOINTEngine();

    readonly sigint=

    new SIGINTEngine();

    readonly communications=

    new SpaceCommunicationEngine();

    readonly monitoring=

    new GlobalInfrastructureMonitoringEngine();

}
