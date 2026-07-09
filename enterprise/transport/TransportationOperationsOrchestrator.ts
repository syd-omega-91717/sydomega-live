// ============================================================================
// FILE:
// /enterprise/transport/TransportationOperationsOrchestrator.ts
// ============================================================================

import { AirlineOperationsEngine } from "./AirlineOperationsEngine";
import { AirportOperationsEngine } from "./AirportOperationsEngine";
import { AirTrafficIntegrationEngine } from "./AirTrafficIntegrationEngine";
import { MaritimePortManagementEngine } from "./MaritimePortManagementEngine";
import { PublicTransitManagementEngine } from "./PublicTransitManagementEngine";
import { RailOperationsEngine } from "./RailOperationsEngine";
import { RouteOptimizationEngine } from "./RouteOptimizationEngine";
import { TransportationDigitalTwinEngine } from "./TransportationDigitalTwinEngine";
import { VesselFleetManagementEngine } from "./VesselFleetManagementEngine";

export class TransportationOperationsOrchestrator{

    readonly airlines=new AirlineOperationsEngine();

    readonly airports=new AirportOperationsEngine();

    readonly airTraffic=new AirTrafficIntegrationEngine();

    readonly ports=new MaritimePortManagementEngine();

    readonly vessels=new VesselFleetManagementEngine();

    readonly rail=new RailOperationsEngine();

    readonly transit=new PublicTransitManagementEngine();

    readonly routing=new RouteOptimizationEngine();

    readonly digitalTwin=new TransportationDigitalTwinEngine();

}
