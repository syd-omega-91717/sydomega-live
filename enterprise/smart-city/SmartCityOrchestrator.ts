// ============================================================================
// FILE:
// /enterprise/smart-city/SmartCityOrchestrator.ts
// ============================================================================

import { DigitalCityTwinEngine } from "./DigitalCityTwinEngine";
import { EmergencyCoordinationEngine } from "./EmergencyCoordinationEngine";
import { EnvironmentalMonitoringEngine } from "./EnvironmentalMonitoringEngine";
import { InfrastructureAnalyticsEngine } from "./InfrastructureAnalyticsEngine";
import { PublicSafetyEngine } from "./PublicSafetyEngine";
import { SmartGridEngine } from "./SmartGridEngine";
import { TrafficManagementEngine } from "./TrafficManagementEngine";
import { WaterNetworkEngine } from "./WaterNetworkEngine";

export class SmartCityOrchestrator{

    readonly cityTwin=

    new DigitalCityTwinEngine();

    readonly traffic=

    new TrafficManagementEngine();

    readonly smartGrid=

    new SmartGridEngine();

    readonly water=

    new WaterNetworkEngine();

    readonly environment=

    new EnvironmentalMonitoringEngine();

    readonly emergency=

    new EmergencyCoordinationEngine();

    readonly publicSafety=

    new PublicSafetyEngine();

    readonly analytics=

    new InfrastructureAnalyticsEngine();

}
