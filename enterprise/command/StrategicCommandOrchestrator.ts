// ============================================================================
// FILE:
// /enterprise/command/StrategicCommandOrchestrator.ts
// ============================================================================

import { AlertFusionEngine } from "./AlertFusionEngine";
import { CommandDashboardEngine } from "./CommandDashboardEngine";
import { GISCommandMapEngine } from "./GISCommandMapEngine";
import { IncidentCommandEngine } from "./IncidentCommandEngine";
import { MissionEngine } from "./MissionEngine";
import { MultiAgencyCoordinationEngine } from "./MultiAgencyCoordinationEngine";
import { OperationalPlanningEngine } from "./OperationalPlanningEngine";
import { ResourceAllocationEngine } from "./ResourceAllocationEngine";
import { TelemetryCommandEngine } from "./TelemetryCommandEngine";

export class StrategicCommandOrchestrator{

    readonly dashboard=

    new CommandDashboardEngine();

    readonly missions=

    new MissionEngine();

    readonly gis=

    new GISCommandMapEngine();

    readonly telemetry=

    new TelemetryCommandEngine();

    readonly alerts=

    new AlertFusionEngine();

    readonly planning=

    new OperationalPlanningEngine();

    readonly resources=

    new ResourceAllocationEngine();

    readonly incidents=

    new IncidentCommandEngine();

    readonly coordination=

    new MultiAgencyCoordinationEngine();

}
