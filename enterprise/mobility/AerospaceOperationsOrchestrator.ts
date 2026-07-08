// ============================================================================
// FILE:
// /enterprise/mobility/AerospaceOperationsOrchestrator.ts
// ============================================================================

import { AirTrafficManagementEngine } from "./AirTrafficManagementEngine";
import { AirportOperationsEngine } from "./AirportOperationsEngine";
import { AutonomousMobilityEngine } from "./AutonomousMobilityEngine";
import { FleetManagementEngine } from "./FleetManagementEngine";
import { LogisticsMobilityEngine } from "./LogisticsMobilityEngine";
import { MaritimeOperationsEngine } from "./MaritimeOperationsEngine";
import { NavigationEngine } from "./NavigationEngine";
import { PortManagementEngine } from "./PortManagementEngine";
import { UAVOperationsEngine } from "./UAVOperationsEngine";

export class AerospaceOperationsOrchestrator{

    readonly airTraffic=

    new AirTrafficManagementEngine();

    readonly airports=

    new AirportOperationsEngine();

    readonly fleet=

    new FleetManagementEngine();

    readonly maritime=

    new MaritimeOperationsEngine();

    readonly ports=

    new PortManagementEngine();

    readonly uav=

    new UAVOperationsEngine();

    readonly autonomous=

    new AutonomousMobilityEngine();

    readonly navigation=

    new NavigationEngine();

    readonly logistics=

    new LogisticsMobilityEngine();

}
