// ============================================================================
// FILE:
// /enterprise/government/GovernmentOperationsOrchestrator.ts
// ============================================================================

import { DigitalIdentityEngine } from "./DigitalIdentityEngine";
import { EmergencyManagementEngine } from "./EmergencyManagementEngine";
import { IoTInfrastructureEngine } from "./IoTInfrastructureEngine";
import { NationalCitizenRegistryEngine } from "./NationalCitizenRegistryEngine";
import { NationalDigitalTwinEngine } from "./NationalDigitalTwinEngine";
import { PublicServicesEngine } from "./PublicServicesEngine";
import { SmartCityPlatformEngine } from "./SmartCityPlatformEngine";
import { TransportationManagementEngine } from "./TransportationManagementEngine";
import { UtilitiesManagementEngine } from "./UtilitiesManagementEngine";

export class GovernmentOperationsOrchestrator{

    readonly identity=new DigitalIdentityEngine();

    readonly registry=new NationalCitizenRegistryEngine();

    readonly smartCities=new SmartCityPlatformEngine();

    readonly infrastructure=new IoTInfrastructureEngine();

    readonly publicServices=new PublicServicesEngine();

    readonly emergency=new EmergencyManagementEngine();

    readonly transportation=new TransportationManagementEngine();

    readonly utilities=new UtilitiesManagementEngine();

    readonly digitalTwin=new NationalDigitalTwinEngine();

}
