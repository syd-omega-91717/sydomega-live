// ============================================================================
// FILE:
// /enterprise/manufacturing/IndustrialOrchestrator.ts
// ============================================================================

import { DigitalFactoryTwinEngine } from "./DigitalFactoryTwinEngine";
import { IndustrialAIEngine } from "./IndustrialAIEngine";
import { IndustrialIoTEngine } from "./IndustrialIoTEngine";
import { ManufacturingExecutionEngine } from "./ManufacturingExecutionEngine";
import { OPCUAGateway } from "./OPCUAGateway";
import { PredictiveMaintenanceEngine } from "./PredictiveMaintenanceEngine";
import { ProductionPlanningEngine } from "./ProductionPlanningEngine";
import { QualityManagementEngine } from "./QualityManagementEngine";
import { SCADAEngine } from "./SCADAEngine";
import { SupplyChainSynchronizationEngine } from "./SupplyChainSynchronizationEngine";

export class IndustrialOrchestrator{

    readonly iot=new IndustrialIoTEngine();

    readonly scada=new SCADAEngine();

    readonly opcua=new OPCUAGateway();

    readonly mes=new ManufacturingExecutionEngine();

    readonly planning=new ProductionPlanningEngine();

    readonly maintenance=new PredictiveMaintenanceEngine();

    readonly quality=new QualityManagementEngine();

    readonly factoryTwin=new DigitalFactoryTwinEngine();

    readonly supplyChain=new SupplyChainSynchronizationEngine();

    readonly ai=new IndustrialAIEngine();

}
