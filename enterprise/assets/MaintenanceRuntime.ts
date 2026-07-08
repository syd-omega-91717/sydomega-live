// ============================================================================
// FILE:
// /enterprise/assets/MaintenanceRuntime.ts
// ============================================================================

import { AssetRegistry } from "./AssetRegistry";
import { CalibrationEngine } from "./CalibrationEngine";
import { EquipmentLifecycleEngine } from "./EquipmentLifecycleEngine";
import { FacilityManagementEngine } from "./FacilityManagementEngine";
import { InspectionEngine } from "./InspectionEngine";
import { InventoryEngine } from "./InventoryEngine";
import { IoTIntegrationEngine } from "./IoTIntegrationEngine";
import { PreventiveMaintenanceEngine } from "./PreventiveMaintenanceEngine";
import { WorkOrderEngine } from "./WorkOrderEngine";

export class MaintenanceRuntime{

    readonly assets=

    new AssetRegistry();

    readonly lifecycle=

    new EquipmentLifecycleEngine();

    readonly maintenance=

    new PreventiveMaintenanceEngine();

    readonly workorders=

    new WorkOrderEngine();

    readonly inventory=

    new InventoryEngine();

    readonly facilities=

    new FacilityManagementEngine();

    readonly iot=

    new IoTIntegrationEngine();

    readonly inspections=

    new InspectionEngine();

    readonly calibrations=

    new CalibrationEngine();

}
