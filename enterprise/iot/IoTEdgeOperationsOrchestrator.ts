// ============================================================================
// FILE:
// /enterprise/iot/IoTEdgeOperationsOrchestrator.ts
// ============================================================================

import { AutonomousDeviceManagementEngine } from "./AutonomousDeviceManagementEngine";
import { DeviceProvisioningEngine } from "./DeviceProvisioningEngine";
import { DigitalSensorNetworkEngine } from "./DigitalSensorNetworkEngine";
import { EdgeComputingRuntimeEngine } from "./EdgeComputingRuntimeEngine";
import { IndustrialIoTEngine } from "./IndustrialIoTEngine";
import { IoTDeviceRegistryEngine } from "./IoTDeviceRegistryEngine";
import { PredictiveMaintenanceEngine } from "./PredictiveMaintenanceEngine";
import { SmartBuildingAutomationEngine } from "./SmartBuildingAutomationEngine";
import { SmartCityInfrastructureEngine } from "./SmartCityInfrastructureEngine";

export class IoTEdgeOperationsOrchestrator{

    readonly registry=new IoTDeviceRegistryEngine();

    readonly provisioning=new DeviceProvisioningEngine();

    readonly sensors=new DigitalSensorNetworkEngine();

    readonly edge=new EdgeComputingRuntimeEngine();

    readonly iiot=new IndustrialIoTEngine();

    readonly buildings=new SmartBuildingAutomationEngine();

    readonly smartCity=new SmartCityInfrastructureEngine();

    readonly autonomous=new AutonomousDeviceManagementEngine();

    readonly maintenance=new PredictiveMaintenanceEngine();

}
