// ============================================================================
// FILE:
// /enterprise/manufacturing/ManufacturingOperationsOrchestrator.ts
// ============================================================================

import { DigitalFactoryTwinEngine } from "./DigitalFactoryTwinEngine";
import { IndustrialIoTEngine } from "./IndustrialIoTEngine";
import { ManufacturingExecutionEngine } from "./ManufacturingExecutionEngine";
import { PLCOrchestrationEngine } from "./PLCOrchestrationEngine";
import { PredictiveMaintenanceEngine } from "./PredictiveMaintenanceEngine";
import { ProductionSchedulingEngine } from "./ProductionSchedulingEngine";
import { QualityManagementEngine } from "./QualityManagementEngine";
import { SCADAIntegrationEngine } from "./SCADAIntegrationEngine";
import { SupplyChainSynchronizationEngine } from "./SupplyChainSynchronizationEngine";

export class ManufacturingOperationsOrchestrator{

    readonly mes=new ManufacturingExecutionEngine();

    readonly iiot=new IndustrialIoTEngine();

    readonly scada=new SCADAIntegrationEngine();

    readonly plc=new PLCOrchestrationEngine();

    readonly digitalTwin=new DigitalFactoryTwinEngine();

    readonly maintenance=new PredictiveMaintenanceEngine();

    readonly scheduling=new ProductionSchedulingEngine();

    readonly quality=new QualityManagementEngine();

    readonly supplyChain=new SupplyChainSynchronizationEngine();

}
